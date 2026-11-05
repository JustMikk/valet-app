// The event pay sheet as files (ADR-022): a CSV that opens in Excel laid out like the client's
// "event / valet schedule", and a printable PDF.
import type { EventPay, PayState } from "@/lib/data"
import { formatHoursDecimal, formatMoney, formatRate } from "@/lib/money/format"
import { buildPdf, PAGE, type PdfPage, type TextItem } from "@/lib/pdf/text-pdf"

export const PAY_STATE_WORD: Record<PayState, string> = {
  paid: "Paid",
  pending: "Pending",
  in_review: "In review",
  on_shift: "On shift",
}

const dollars = (cents: number) => (cents / 100).toFixed(2)
const hours = (minutes: number) => (minutes / 60).toFixed(2)
const yesNo = (value: boolean) => (value ? "Yes" : "No")

/** One CSV cell: formulas defused (a name like "=1+1" stays text), commas and quotes escaped. */
function cell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const csvRow = (values: (string | number)[]) => values.map(cell).join(",")

export function payCsv(sheet: EventPay): string {
  const rate = dollars(sheet.rateCents)
  return [
    csvRow(["Event", `${sheet.venue} · ${sheet.name}`]),
    csvRow(["Date", sheet.date]),
    csvRow(["Time", `${sheet.start} – ${sheet.end}`]),
    csvRow(["Per hour", rate]),
    "",
    csvRow(["No.", "Valet name", "Hours", "Rate", "Total", "Paid", "Tips", "Balance", "Status"]),
    ...sheet.rows.map((row, i) =>
      csvRow([
        i + 1,
        row.name,
        hours(row.minutes),
        rate,
        dollars(row.amountCents),
        yesNo(row.state === "paid"),
        yesNo(row.tips),
        dollars(row.balanceCents),
        PAY_STATE_WORD[row.state],
      ]),
    ),
    "",
    csvRow(["Total valets", sheet.totals.valets]),
    csvRow(["Total hours", hours(sheet.totals.minutes)]),
    csvRow(["Total pay", dollars(sheet.totals.amountCents)]),
    csvRow(["Total paid", dollars(sheet.totals.paidCents)]),
    csvRow(["Total pending", dollars(sheet.totals.pendingCents)]),
  ].join("\r\n")
}

/** "pay-post-oak-hotel-gala-tue-sep-15.csv" */
export function payFileName(sheet: EventPay, extension: "csv" | "pdf"): string {
  const slug = `${sheet.venue} ${sheet.name} ${sheet.date}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `pay-${slug}.${extension}`
}

const LEFT = PAGE.margin
const RIGHT = PAGE.width - PAGE.margin
const TOP = PAGE.height - PAGE.margin
const BOTTOM = PAGE.margin + 40
const ROW = 24
// Right edges of the middle columns; the balance ends at the page margin.
const COLUMNS = { hours: 260, total: 330, paid: 405, tips: 455 } as const

export function payPages(sheet: EventPay, company: string): PdfPage[] {
  const pages: PdfPage[] = [[]]
  let y = TOP
  const put = (item: Omit<TextItem, "y">) => pages.at(-1)?.push({ ...item, y })
  const header = () => {
    put({ text: "Valet", x: LEFT, size: 9, bold: true })
    put({ text: "Hours", x: COLUMNS.hours, size: 9, bold: true, align: "right" })
    put({ text: "Total", x: COLUMNS.total, size: 9, bold: true, align: "right" })
    put({ text: "Paid", x: COLUMNS.paid, size: 9, bold: true, align: "right" })
    put({ text: "Tips", x: COLUMNS.tips, size: 9, bold: true, align: "right" })
    put({ text: "Balance", x: RIGHT, size: 9, bold: true, align: "right" })
    y -= ROW
  }

  put({ text: company, x: LEFT, size: 20, bold: true })
  put({ text: "VALET PAY SHEET", x: RIGHT, size: 12, bold: true, align: "right" })
  y -= 26
  put({ text: `${sheet.venue} · ${sheet.name}`, x: LEFT, size: 14, bold: true })
  y -= 18
  put({
    text: `${sheet.date} · ${sheet.start} – ${sheet.end} · ${formatRate(sheet.rateCents)}`,
    x: LEFT,
    size: 10,
  })
  y -= 36
  header()

  for (const row of sheet.rows) {
    if (y < BOTTOM) {
      pages.push([])
      y = TOP
      header()
    }
    const paid =
      row.state === "paid" || row.state === "pending"
        ? yesNo(row.state === "paid")
        : PAY_STATE_WORD[row.state]
    put({ text: row.name, x: LEFT, size: 10 })
    put({ text: formatHoursDecimal(row.minutes), x: COLUMNS.hours, size: 10, align: "right" })
    put({ text: formatMoney(row.amountCents), x: COLUMNS.total, size: 10, align: "right" })
    put({ text: paid, x: COLUMNS.paid, size: 10, align: "right" })
    put({ text: yesNo(row.tips), x: COLUMNS.tips, size: 10, align: "right" })
    put({ text: formatMoney(row.balanceCents), x: RIGHT, size: 10, align: "right" })
    y -= ROW
  }

  y -= 10
  const totals: [string, string][] = [
    ["Valets", String(sheet.totals.valets)],
    ["Total hours", formatHoursDecimal(sheet.totals.minutes)],
    ["Total pay", formatMoney(sheet.totals.amountCents)],
    ["Paid", formatMoney(sheet.totals.paidCents)],
    ["Pending", formatMoney(sheet.totals.pendingCents)],
  ]
  for (const [label, value] of totals) {
    if (y < BOTTOM) {
      pages.push([])
      y = TOP
    }
    put({ text: label, x: LEFT, size: 11, bold: label === "Pending" })
    put({ text: value, x: RIGHT, size: 11, bold: label === "Pending", align: "right" })
    y -= 18
  }
  return pages
}

export const payPdf = (sheet: EventPay, company: string) => buildPdf(payPages(sheet, company))

/** Saves a file the browser generated (CSV text gets a BOM so Excel reads it as UTF-8). */
export function saveFile(contents: string | Uint8Array<ArrayBuffer>, name: string, type: string) {
  const parts = typeof contents === "string" ? ["﻿", contents] : [contents]
  const url = URL.createObjectURL(new Blob(parts, { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
