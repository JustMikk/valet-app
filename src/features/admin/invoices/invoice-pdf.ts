import type { InvoiceDetail } from "@/lib/data"
import { formatHoursDecimal, formatMoney, formatRate } from "@/lib/money/format"
import { buildPdf, PAGE, type PdfPage, type TextItem } from "@/lib/pdf/text-pdf"

const LEFT = PAGE.margin
const RIGHT = PAGE.width - PAGE.margin
const TOP = PAGE.height - PAGE.margin
const BOTTOM = PAGE.margin + 40
const ROW = 34
// Column right edges: staff, hours, rate; the amount ends at the page margin.
const COLUMNS = { staff: 340, hours: 410, rate: 480 } as const

/** "INV-2026-0142 · DRAFT" → "INV-2026-0142". */
export const invoiceNumber = (label: string) => label.split(" · ")[0] ?? label

/** The invoice as printable pages: header, one row per event, total and (while a draft) the notice. */
export function invoicePages(invoice: InvoiceDetail, company: string): PdfPage[] {
  const pages: PdfPage[] = [[]]
  let y = TOP
  const put = (item: Omit<TextItem, "y">, at = y) => pages.at(-1)?.push({ ...item, y: at })
  const header = () => {
    put({ text: "Description", x: LEFT, size: 9, bold: true })
    put({ text: "Staff", x: COLUMNS.staff, size: 9, bold: true, align: "right" })
    put({ text: "Hours", x: COLUMNS.hours, size: 9, bold: true, align: "right" })
    put({ text: "Rate", x: COLUMNS.rate, size: 9, bold: true, align: "right" })
    put({ text: "Amount", x: RIGHT, size: 9, bold: true, align: "right" })
    y -= ROW / 2
  }

  put({ text: company, x: LEFT, size: 20, bold: true })
  put({ text: "INVOICE", x: RIGHT, size: 12, bold: true, align: "right" })
  y -= 22
  put({ text: invoiceNumber(invoice.number), x: RIGHT, size: 10, align: "right" })
  put({ text: invoice.venue, x: LEFT, size: 14, bold: true })
  y -= 18
  put({ text: invoice.period, x: LEFT, size: 10 })
  if (invoice.billedTo) {
    y -= 16
    put({ text: `Billed to ${invoice.billedTo}`, x: LEFT, size: 10 })
  }
  y -= 36
  header()

  for (const line of invoice.lines) {
    if (y < BOTTOM) {
      pages.push([])
      y = TOP
      header()
    }
    put({ text: line.what, x: LEFT, size: 10 })
    put({ text: String(line.staffCount), x: COLUMNS.staff, size: 10, align: "right" })
    put({ text: formatHoursDecimal(line.minutes), x: COLUMNS.hours, size: 10, align: "right" })
    put({ text: formatRate(line.rateCents), x: COLUMNS.rate, size: 10, align: "right" })
    put({ text: formatMoney(line.amountCents), x: RIGHT, size: 10, align: "right" })
    y -= ROW
  }

  y -= 6
  put({ text: "Total due", x: LEFT, size: 13, bold: true })
  put({ text: formatMoney(invoice.totalCents), x: RIGHT, size: 16, bold: true, align: "right" })
  if (invoice.notice) {
    y -= 34
    put({ text: invoice.notice, x: LEFT, size: 9 })
  }
  return pages
}

/** The PDF file for an invoice. */
export const invoicePdf = (invoice: InvoiceDetail, company: string) =>
  buildPdf(invoicePages(invoice, company))
