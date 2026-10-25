// Invoices (product spec §10.3-10.5): one per venue per period, built from approved hours. Lines
// are a snapshot; the notice about hours still in review is live, so it clears as hours are approved.
import type {
  InvoiceDetail,
  InvoiceRow,
  NewInvoiceRequest,
  Payroll,
  PayrollLine,
} from "@/lib/data/admin/ops-schemas"
import { amountCents, formatHoursDecimal } from "@/lib/money/format"
import { ADMIN_STATUS } from "@/lib/status/admin"
import type { StatusSpec } from "@/lib/status/presets"
import { formatDate } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { badRequest, conflict, notFound } from "../http/handler"
import { adminCtx, messageStaff } from "./common"
import { syncRecentInvoices } from "./event-invoice"
import { nextInvoiceNumber, totalsOf, writeLines, type InvoiceLineInput } from "./invoice-store"

const DAY = 24 * 60 * 60_000
const PAYMENT_TERMS_DAYS = 14

type InvoiceDbRow = {
  id: string
  number: string
  venue: string
  venue_id: string
  tz: string
  period_start: string
  period_end: string
  status: "draft" | "sent" | "paid"
  billed_to: string
  due_at: Date | null
  total_cents: number
  minutes: number
  /** Set for an invoice drafted from one event; period invoices have none. */
  event_id: string | null
  label: string | null
  summary: string | null
}

/** "Oct 16 – 31" within one month, "Oct 28 – Nov 3" across two. */
export function periodLabel(start: string, end: string): string {
  const fmt = (date: string) => formatDate(`${date}T12:00:00Z`, "UTC").split(" ")
  const [, m1, d1] = fmt(start)
  const [, m2, d2] = fmt(end)
  return m1 === m2 ? `${m1} ${d1} – ${d2}` : `${m1} ${d1} – ${m2} ${d2}`
}

function statusOf(row: InvoiceDbRow, now: Date): StatusSpec {
  if (row.status === "draft") return ADMIN_STATUS.draft
  if (row.status === "paid") return ADMIN_STATUS.paid
  if (row.due_at && row.due_at < now) {
    return ADMIN_STATUS.overdue(
      Math.max(1, Math.floor((now.getTime() - row.due_at.getTime()) / DAY)),
    )
  }
  return ADMIN_STATUS.sent
}

async function loadInvoices(tenantId: string, id?: string): Promise<InvoiceDbRow[]> {
  return rows<InvoiceDbRow>(
    sql()`select i.id, i.number, v.name as venue, v.id as venue_id, v.timezone as tz,
            i.period_start::text, i.period_end::text, i.status, i.billed_to, i.due_at,
            i.total_cents, i.minutes, i.event_id, i.label, i.summary
          from invoices i join venues v on v.id = i.venue_id
          where i.tenant_id = ${tenantId} and (${id ?? null}::uuid is null or i.id = ${id ?? null}::uuid)
          order by i.period_start desc, case i.status when 'draft' then 0 else 1 end, v.name`,
  )
}

export async function listInvoices(adminId: string, now: Date): Promise<InvoiceRow[]> {
  const ctx = await adminCtx(adminId)
  // Approved hours that have no invoice yet get one before the list is read.
  await syncRecentInvoices(ctx.tenantId, now)
  return (await loadInvoices(ctx.tenantId)).map((row) => ({
    id: row.id,
    venue: row.venue,
    period: row.label ?? periodLabel(row.period_start, row.period_end),
    status: statusOf(row, now),
    hours: formatHoursDecimal(row.minutes),
    amountCents: row.total_cents,
  }))
}

/** Hours still waiting for approval at this venue in the period: not in the invoice yet. */
async function pendingNotice(row: InvoiceDbRow): Promise<string | null> {
  const pending = await rows<{ starts_at: Date }>(
    sql()`select e.starts_at from assignments a join events e on e.id = a.event_id
          where e.venue_id = ${row.venue_id} and a.hours_status = 'in_review'
            and a.clocked_in_at is not null
            and (a.clocked_out_at is not null or e.ends_at < now())
            and (e.starts_at at time zone ${row.tz})::date between ${row.period_start}::date and ${row.period_end}::date`,
  )
  if (pending.length === 0) return null
  const dates = [
    ...new Set(pending.map((p) => formatDate(p.starts_at, row.tz).split(" ").slice(1).join(" "))),
  ]
  const n = pending.length
  return `${n} ${n === 1 ? "entry" : "entries"} from ${dates.join(", ")} ${n === 1 ? "is" : "are"} still in review and not included.`
}

export async function getInvoice(
  adminId: string,
  id: string | undefined,
  now: Date,
): Promise<InvoiceDetail> {
  const ctx = await adminCtx(adminId)
  const all = await loadInvoices(ctx.tenantId, id)
  // With no id, the first draft (the "New invoice" button has no design yet: D29).
  const row = id ? all[0] : (all.find((i) => i.status === "draft") ?? all[0])
  if (!row) throw notFound("Invoice not found.")
  const lines = await rows<{
    what: string
    detail: string
    staff_count: number
    minutes: number
    rate_cents: number
    amount_cents: number
  }>(
    sql()`select what, detail, staff_count, minutes, rate_cents, amount_cents from invoice_lines
          where invoice_id = ${row.id} order by position`,
  )
  const status = statusOf(row, now).label
  return {
    id: row.id,
    number: `${row.number} · ${status.replace(/ \d+d$/, "").toUpperCase()}`,
    venue: row.venue,
    period:
      row.summary ??
      `${periodLabel(row.period_start, row.period_end)}, ${row.period_end.slice(0, 4)} · from approved hours`,
    eventId: row.event_id ?? undefined,
    totalCents: row.total_cents,
    notice: row.status === "draft" && !row.event_id ? await pendingNotice(row) : null,
    billedTo: row.billed_to,
    sent: row.status !== "draft",
    lines: lines.map((line) => ({
      what: line.what,
      detail: line.detail || undefined,
      staffCount: line.staff_count,
      minutes: line.minutes,
      rateCents: line.rate_cents,
      amountCents: line.amount_cents,
    })),
  }
}

/** Send a draft: it is locked from here on and due in fourteen days. */
export async function sendInvoice(
  adminId: string,
  id: string,
  now: Date,
): Promise<{ billedTo: string }> {
  const ctx = await adminCtx(adminId)
  const [sent] = await rows<{ billed_to: string }>(
    sql()`update invoices set status = 'sent', sent_at = ${now.toISOString()},
                 due_at = ${new Date(now.getTime() + PAYMENT_TERMS_DAYS * DAY).toISOString()}
          where id = ${id} and tenant_id = ${ctx.tenantId} and status = 'draft'
          returning billed_to`,
  )
  if (!sent) {
    const existing = await loadInvoices(ctx.tenantId, id)
    if (existing.length === 0) throw notFound("Invoice not found.")
    throw conflict("already_sent", "That invoice was already sent.")
  }
  return { billedTo: sent.billed_to }
}

type ApprovedLine = {
  id: string
  label: string
  starts_at: Date
  staff_count: number
  minutes: number
}

/**
 * Builds a draft invoice for one venue and period from the hours approved so far (a snapshot, like
 * the seeded ones). Hours still in review are not included; the invoice’s notice says so.
 */
export async function createInvoice(
  adminId: string,
  input: NewInvoiceRequest,
  now: Date,
): Promise<{ id: string }> {
  const ctx = await adminCtx(adminId)
  if (input.periodEnd < input.periodStart) {
    throw badRequest("The period ends before it starts.", "invalid_request")
  }
  const [venue] = await rows<{
    id: string
    name: string
    timezone: string
    bill_rate_cents: number
    billing_email: string
  }>(
    sql()`select id, name, timezone, bill_rate_cents, billing_email from venues
          where id = ${input.venueId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!venue) throw badRequest("Choose a venue.", "invalid_request")

  const [existing] = await rows<{ id: string }>(
    sql()`select id from invoices
          where venue_id = ${venue.id} and event_id is null and period_start = ${input.periodStart}::date
            and period_end = ${input.periodEnd}::date limit 1`,
  )
  if (existing) {
    throw conflict("invoice_exists", `${venue.name} already has an invoice for that period.`)
  }

  const events = await rows<ApprovedLine>(
    sql()`select e.id, coalesce(nullif(e.kind, ''), e.title) as label, e.starts_at,
                 count(*)::int as staff_count,
                 round(sum(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60))::int as minutes
          from assignments a join events e on e.id = a.event_id
          where e.venue_id = ${venue.id} and a.hours_status = 'approved'
            and a.clocked_in_at is not null and a.clocked_out_at is not null
            and (e.starts_at at time zone ${venue.timezone})::date
                between ${input.periodStart}::date and ${input.periodEnd}::date
            and not exists (select 1 from invoices billed where billed.event_id = e.id)
            and not exists (select 1 from invoice_events ie where ie.event_id = e.id)
          group by e.id, e.kind, e.title, e.starts_at
          order by e.starts_at`,
  )
  if (events.length === 0) {
    throw conflict(
      "nothing_to_invoice",
      `There are no approved hours at ${venue.name} in that period yet. Approve hours first.`,
    )
  }

  const lines: InvoiceLineInput[] = events.map((event) => ({
    detail: "",
    what: `${event.label} · ${formatDate(event.starts_at, venue.timezone)}`,
    staff_count: event.staff_count,
    minutes: event.minutes,
    rate_cents: venue.bill_rate_cents,
    amount_cents: amountCents(event.minutes, venue.bill_rate_cents),
  }))
  const { total, minutes } = totalsOf(lines)
  const number = await nextInvoiceNumber(ctx.tenantId, now)

  const [created] = await rows<{ id: string }>(
    sql()`insert into invoices (tenant_id, venue_id, number, period_start, period_end, status,
                                billed_to, total_cents, minutes)
          values (${ctx.tenantId}, ${venue.id}, ${number}, ${input.periodStart}::date,
                  ${input.periodEnd}::date, 'draft', ${venue.billing_email}, ${total}, ${minutes})
          returning id`,
  )
  await writeLines(created.id, lines)
  // Remember which events this billed, so none of them is drafted again as an event invoice.
  await sql()`insert into invoice_events (invoice_id, event_id)
              select ${created.id}, x::uuid
              from jsonb_array_elements_text(${JSON.stringify(events.map((e) => e.id))}::jsonb) as x`
  return { id: created.id }
}

type PayrollDbRow = {
  staff_id: string
  name: string
  email: string
  shifts: string
  minutes: string
  amount_cents: string
}

type PayrollLineDbRow = {
  staff_id: string
  event: string
  date: string
  minutes: string
  amount_cents: string
}

function payrollPeriod(now: Date): { start: string; end: string; label: string } {
  const second = now.getDate() >= 16
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, "0")
  const lastDay = new Date(y, m, 0).getDate()
  const start = `${y}-${pad(m)}-${pad(second ? 16 : 1)}`
  const end = `${y}-${pad(m)}-${pad(second ? lastDay : 15)}`
  return { start, end, label: periodLabel(start, end) }
}

/**
 * Payroll summary: approved hours per staff member in the current billing half-month,
 * with per-event breakdown lines. Uses the venue's bill rate as the rate proxy.
 */
export async function getPayroll(adminId: string, now: Date): Promise<Payroll> {
  const ctx = await adminCtx(adminId)
  const period = payrollPeriod(now)

  const [staffRows, lineRows] = await Promise.all([
    rows<PayrollDbRow>(
      sql()`select s.id as staff_id, s.name, s.email,
              count(distinct a.id)::text as shifts,
              coalesce(sum(
                round(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60)
              ), 0)::text as minutes,
              coalesce(sum(
                round(round(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60)
                      * v.bill_rate_cents / 60)
              ), 0)::text as amount_cents
            from staff s
            join assignments a on a.staff_id = s.id
            join events e on e.id = a.event_id
            join venues v on v.id = e.venue_id
            where s.tenant_id = ${ctx.tenantId}
              and a.hours_status = 'approved'
              and a.clocked_in_at is not null and a.clocked_out_at is not null
              and (e.starts_at at time zone ${ctx.tz})::date
                  between ${period.start}::date and ${period.end}::date
            group by s.id, s.name, s.email
            order by s.name`,
    ),
    rows<PayrollLineDbRow>(
      sql()`select a.staff_id,
              coalesce(nullif(e.kind, ''), e.title) as event,
              to_char(e.starts_at at time zone ${ctx.tz}, 'Mon DD') as date,
              round(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60)::text as minutes,
              round(round(extract(epoch from (a.clocked_out_at - a.clocked_in_at)) / 60)
                    * v.bill_rate_cents / 60)::text as amount_cents
            from assignments a
            join events e on e.id = a.event_id
            join venues v on v.id = e.venue_id
            join staff s on s.id = a.staff_id
            where s.tenant_id = ${ctx.tenantId}
              and a.hours_status = 'approved'
              and a.clocked_in_at is not null and a.clocked_out_at is not null
              and (e.starts_at at time zone ${ctx.tz})::date
                  between ${period.start}::date and ${period.end}::date
            order by a.staff_id, e.starts_at`,
    ),
  ])

  // Group lines by staff_id
  const linesByStaff = new Map<string, PayrollLine[]>()
  for (const lr of lineRows) {
    const arr = linesByStaff.get(lr.staff_id) ?? []
    arr.push({
      event: lr.event,
      date: lr.date,
      hours: formatHoursDecimal(Number(lr.minutes)),
      amountCents: Number(lr.amount_cents),
    })
    linesByStaff.set(lr.staff_id, arr)
  }

  const totalCents = staffRows.reduce((sum, r) => sum + Number(r.amount_cents), 0)

  return {
    period: period.label,
    rows: staffRows.map((r) => ({
      staffId: r.staff_id,
      initials: r.name
        .split(" ")
        .map((w) => w[0] ?? "")
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      name: r.name,
      email: r.email,
      shifts: Number(r.shifts),
      hours: formatHoursDecimal(Number(r.minutes)),
      amountCents: Number(r.amount_cents),
      lines: linesByStaff.get(r.staff_id) ?? [],
    })),
    totalCents,
  }
}

/**
 * Send each staff member their pay stub for the current period as an inbox message.
 * Returns the number of messages sent.
 */
export async function sendPayroll(adminId: string, now: Date): Promise<{ sent: number }> {
  const ctx = await adminCtx(adminId)
  const data = await getPayroll(adminId, now)
  if (data.rows.length === 0) return { sent: 0 }

  await Promise.all(
    data.rows.map((row) => {
      const lines = row.lines
        .map((l) => `  ${l.date}  ${l.event}  ${l.hours}h  $${(l.amountCents / 100).toFixed(2)}`)
        .join("\n")
      const body =
        `Pay summary for ${data.period}\n\n` +
        `Shifts: ${row.shifts}  |  Hours: ${row.hours}  |  Est. pay: $${(row.amountCents / 100).toFixed(2)}\n\n` +
        (lines ? `Breakdown:\n${lines}\n\n` : "") +
        `Rates are estimated from the venue rate — your actual pay may differ.`
      return messageStaff(ctx, row.staffId, body)
    }),
  )

  return { sent: data.rows.length }
}
