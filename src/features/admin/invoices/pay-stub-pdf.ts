// One valet's pay stub for the payroll period as a PDF, with the Regency banner ("PAY STUB" and the
// period) on every page.
import type { PayrollRow } from "@/lib/data"
import { formatMoney } from "@/lib/money/format"
import {
  buildPdf,
  CONTENT_TOP,
  PAGE,
  type PdfImage,
  type PdfPage,
  type TextItem,
} from "@/lib/pdf/text-pdf"

const LEFT = PAGE.margin
const RIGHT = PAGE.width - PAGE.margin
const BOTTOM = PAGE.margin + 40
const ROW = 24
// Date starts here; hours and amount end at these right edges; "Paid" ends at the margin.
const COLUMNS = { date: 300, hours: 410, amount: 490 } as const

export function payStubPages(row: PayrollRow, period: string, company: string): PdfPage[] {
  const pages: PdfPage[] = [[]]
  let y = CONTENT_TOP
  const put = (item: Omit<TextItem, "y">) => pages.at(-1)?.push({ ...item, y })
  const header = () => {
    put({ text: "Event", x: LEFT, size: 9, bold: true })
    put({ text: "Date", x: COLUMNS.date, size: 9, bold: true })
    put({ text: "Hours", x: COLUMNS.hours, size: 9, bold: true, align: "right" })
    put({ text: "Amount", x: COLUMNS.amount, size: 9, bold: true, align: "right" })
    put({ text: "Paid", x: RIGHT, size: 9, bold: true, align: "right" })
    y -= ROW
  }

  put({ text: company, x: LEFT, size: 16, bold: true })
  y -= 22
  put({ text: row.name, x: LEFT, size: 14, bold: true })
  y -= 18
  put({ text: `${period} · ${row.email}`, x: LEFT, size: 10 })
  y -= 34
  header()

  for (const line of row.lines) {
    if (y < BOTTOM) {
      pages.push([])
      y = CONTENT_TOP
      header()
    }
    put({ text: line.event, x: LEFT, size: 10 })
    put({ text: line.date, x: COLUMNS.date, size: 10 })
    put({ text: line.hours, x: COLUMNS.hours, size: 10, align: "right" })
    put({ text: formatMoney(line.amountCents), x: COLUMNS.amount, size: 10, align: "right" })
    put({ text: line.paid ? "Yes" : "No", x: RIGHT, size: 10, align: "right" })
    y -= ROW
  }
  if (row.lines.length === 0) {
    put({ text: "No approved shifts this period.", x: LEFT, size: 10 })
    y -= ROW
  }

  y -= 10
  const totals: [string, string, string?][] = [
    ["Total", formatMoney(row.amountCents), row.hours],
    ["Pending", formatMoney(row.pendingCents)],
  ]
  for (const [label, amount, hours] of totals) {
    if (y < BOTTOM) {
      pages.push([])
      y = CONTENT_TOP
    }
    put({ text: label, x: LEFT, size: 11, bold: true })
    if (hours) put({ text: hours, x: COLUMNS.hours, size: 11, bold: true, align: "right" })
    put({ text: amount, x: COLUMNS.amount, size: 11, bold: true, align: "right" })
    y -= 18
  }
  y -= 16
  put({ text: "At each event's valet pay rate.", x: LEFT, size: 9 })
  return pages
}

export const payStubPdf = (
  row: PayrollRow,
  period: string,
  company: string,
  logo: PdfImage | null,
) =>
  buildPdf(payStubPages(row, period, company), {
    banner: { title: "PAY STUB", subtitle: period, logo },
  })

/** "pay-stub-sebah-idris-sep-1-15.pdf" */
export function payStubFileName(row: PayrollRow, period: string): string {
  const slug = `${row.name} ${period}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `pay-stub-${slug}.pdf`
}
