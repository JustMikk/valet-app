// Shared by every way an invoice gets made (a period built by hand, an event drafted by the system)
// and sent: the next number, the stored lines and the period's label.
import { formatDate } from "@/lib/time/labels"

import { rows, sql } from "../db/client"

/** "Oct 16 – 31" within one month, "Oct 28 – Nov 3" across two. */
export function periodLabel(start: string, end: string): string {
  const fmt = (date: string) => formatDate(`${date}T12:00:00Z`, "UTC").split(" ")
  const [, m1, d1] = fmt(start)
  const [, m2, d2] = fmt(end)
  return m1 === m2 ? `${m1} ${d1} – ${d2}` : `${m1} ${d1} – ${m2} ${d2}`
}

export type InvoiceLineInput = {
  what: string
  detail: string
  staff_count: number
  minutes: number
  rate_cents: number
  amount_cents: number
}

export const totalsOf = (lines: InvoiceLineInput[]) => ({
  total: lines.reduce((sum, line) => sum + line.amount_cents, 0),
  minutes: lines.reduce((sum, line) => sum + line.minutes, 0),
})

/** "INV-2026-0143": the tenant's running sequence, the year of the day it is made. */
export async function nextInvoiceNumber(tenantId: string, now: Date): Promise<string> {
  const [{ next }] = await rows<{ next: number }>(
    sql()`select coalesce(max(substring(number from '([0-9]+)$')::int), 0) + 1 as next
          from invoices where tenant_id = ${tenantId}`,
  )
  return `INV-${now.getUTCFullYear()}-${String(next).padStart(4, "0")}`
}

/** Stores the lines in order, replacing any the invoice already has. */
export async function writeLines(invoiceId: string, lines: InvoiceLineInput[]): Promise<void> {
  const numbered = JSON.stringify(lines.map((line, i) => ({ ...line, position: i + 1 })))
  await sql()`delete from invoice_lines where invoice_id = ${invoiceId}`
  await sql()`insert into invoice_lines (invoice_id, position, what, detail, staff_count, minutes, rate_cents, amount_cents)
              select ${invoiceId}, x.position, x.what, x.detail, x.staff_count, x.minutes, x.rate_cents, x.amount_cents
              from jsonb_to_recordset(${numbered}::jsonb)
                as x(position int, what text, detail text, staff_count int, minutes int, rate_cents int, amount_cents int)`
}
