// The event pay sheet (ADR-022): each valet's hours for one event at the event's own rate, marked
// paid and tipped here. Only approved hours can be marked paid; what was paid stays as paid.
import type { EventPay, PayMarkPatch, PayrollEventRow } from "@/lib/data/admin/ops-schemas"
import { formatMoney } from "@/lib/money/format"
import { eventPayState, paySheet, payStubText, taxCents, type PayState } from "@/lib/pay/pay-sheet"
import { ADMIN_STATUS } from "@/lib/status/admin"
import type { StatusSpec } from "@/lib/status/presets"
import { formatDate, formatTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { conflict, notFound } from "../http/handler"
import { adminCtx, messageStaff, notifyStaff } from "./common"

type EventRow = {
  id: string
  name: string
  venue: string
  address: string
  tz: string
  starts_at: Date
  ends_at: Date
  pay_rate_cents: number
  sales_tax_bp: number
}

type ShiftRow = {
  event_id: string
  assignment_id: string
  staff_id: string
  name: string
  clocked_in_at: Date | null
  clocked_out_at: Date | null
  hours_status: string
  paid_cents: number | null
  tips: boolean
}

async function eventOf(tenantId: string, eventId: string): Promise<EventRow> {
  const [event] = await rows<EventRow>(
    sql()`select e.id, coalesce(nullif(e.kind, ''), e.title) as name, v.name as venue, v.address,
                 v.timezone as tz, e.starts_at, e.ends_at, e.pay_rate_cents, t.sales_tax_bp
          from events e join venues v on v.id = e.venue_id join tenants t on t.id = e.tenant_id
          where e.id = ${eventId} and e.tenant_id = ${tenantId}`,
  )
  if (!event) throw notFound("Event not found.")
  return event
}

async function shiftsOf(eventIds: string[]): Promise<ShiftRow[]> {
  return rows<ShiftRow>(
    sql()`select a.event_id, a.id as assignment_id, s.id as staff_id, s.name, a.clocked_in_at,
                 a.clocked_out_at, a.hours_status, a.paid_cents, a.tips
          from assignments a join staff s on s.id = a.staff_id
          where a.event_id = any(${eventIds}::uuid[])`,
  )
}

function sheetFrom(event: EventRow, shifts: ShiftRow[]): EventPay {
  const sheet = paySheet(
    shifts.map((shift) => ({
      assignmentId: shift.assignment_id,
      staffId: shift.staff_id,
      name: shift.name,
      clockedInAt: shift.clocked_in_at,
      clockedOutAt: shift.clocked_out_at,
      approved: shift.hours_status === "approved",
      paidCents: shift.paid_cents,
      tips: shift.tips,
    })),
    event.pay_rate_cents,
  )
  const tax = taxCents(sheet.totals.amountCents, event.sales_tax_bp)
  return {
    eventId: event.id,
    venue: event.venue,
    name: event.name,
    date: formatDate(event.starts_at, event.tz),
    start: formatTime(event.starts_at, event.tz),
    end: formatTime(event.ends_at, event.tz),
    address: event.address,
    rateCents: event.pay_rate_cents,
    taxBp: event.sales_tax_bp,
    rows: sheet.rows,
    totals: { ...sheet.totals, taxCents: tax, afterTaxCents: sheet.totals.amountCents + tax },
  }
}

async function sheetOf(tenantId: string, eventId: string): Promise<EventPay> {
  const event = await eventOf(tenantId, eventId)
  return sheetFrom(event, await shiftsOf([eventId]))
}

const LIST_STATUS: Record<PayState, StatusSpec> = {
  in_review: ADMIN_STATUS.payInReview,
  pending: ADMIN_STATUS.payPending,
  on_shift: ADMIN_STATUS.onShift,
  paid: ADMIN_STATUS.paid,
}

/** Payroll's "By event" list: the latest finished events where someone clocked in. */
export async function listPayrollEvents(adminId: string): Promise<PayrollEventRow[]> {
  const ctx = await adminCtx(adminId)
  const events = await rows<EventRow>(
    sql()`select e.id, coalesce(nullif(e.kind, ''), e.title) as name, v.name as venue, v.address,
                 v.timezone as tz, e.starts_at, e.ends_at, e.pay_rate_cents, t.sales_tax_bp
          from events e join venues v on v.id = e.venue_id join tenants t on t.id = e.tenant_id
          where e.tenant_id = ${ctx.tenantId} and e.ends_at < now()
            and exists (select 1 from assignments a
                        where a.event_id = e.id and a.clocked_in_at is not null)
          order by e.starts_at desc limit 60`,
  )
  if (events.length === 0) return []
  const shifts = await shiftsOf(events.map((event) => event.id))
  return events.map((event) => {
    const sheet = sheetFrom(
      event,
      shifts.filter((shift) => shift.event_id === event.id),
    )
    return {
      eventId: event.id,
      venue: sheet.venue,
      name: sheet.name,
      date: sheet.date,
      time: `${sheet.start} – ${sheet.end}`,
      valets: sheet.totals.valets,
      minutes: sheet.totals.minutes,
      amountCents: sheet.totals.amountCents,
      pendingCents: sheet.totals.pendingCents,
      status: LIST_STATUS[eventPayState(sheet.rows)],
    }
  })
}

/**
 * Sends one valet (or every valet who finished the event) their pay stub for it: the details as an
 * inbox message, and a notification that always lands in their notification center.
 */
export async function sendEventPay(
  adminId: string,
  eventId: string,
  staffId: string | undefined,
): Promise<{ sent: number }> {
  const ctx = await adminCtx(adminId)
  const sheet = await sheetOf(ctx.tenantId, eventId)
  const targets = sheet.rows.filter(
    (row) => row.state !== "on_shift" && (staffId === undefined || row.staffId === staffId),
  )
  if (targets.length === 0) {
    throw conflict(
      "nothing_to_send",
      staffId
        ? "That valet has no finished hours on this event."
        : "No one has finished hours on this event yet.",
    )
  }
  await Promise.all(
    targets.map((row) =>
      messageStaff(ctx, row.staffId, payStubText(sheet, row), { notify: false }),
    ),
  )
  await notifyStaff(
    targets.map((row) => ({
      staffId: row.staffId,
      icon: "request_quote",
      tone: "info" as const,
      title: `Pay stub · ${sheet.venue}`,
      body: `${sheet.name}, ${sheet.date}: ${formatMoney(row.amountCents)} · ${row.state === "paid" ? "paid" : "pending"}`,
      href: "/staff/inbox",
    })),
  )
  return { sent: targets.length }
}

export async function getEventPay(adminId: string, eventId: string): Promise<EventPay> {
  const ctx = await adminCtx(adminId)
  return sheetOf(ctx.tenantId, eventId)
}

/** Changes the event's valet rate. Shifts already paid keep what was paid. */
export async function setEventPayRate(
  adminId: string,
  eventId: string,
  rateCents: number,
): Promise<EventPay> {
  const ctx = await adminCtx(adminId)
  await eventOf(ctx.tenantId, eventId)
  await sql()`update events set pay_rate_cents = ${rateCents}
              where id = ${eventId} and tenant_id = ${ctx.tenantId}`
  return sheetOf(ctx.tenantId, eventId)
}

/** Marks one valet's shift paid (at what it comes to now) or unpaid, and tips received or not. */
export async function markEventPay(
  adminId: string,
  eventId: string,
  assignmentId: string,
  patch: PayMarkPatch,
): Promise<EventPay> {
  const ctx = await adminCtx(adminId)
  const sheet = await sheetOf(ctx.tenantId, eventId)
  const row = sheet.rows.find((candidate) => candidate.assignmentId === assignmentId)
  if (!row) throw notFound("That valet isn't on this event's pay sheet.")
  if (patch.paid === true && row.state !== "paid") {
    if (row.state === "on_shift") {
      throw conflict("still_on_shift", `${row.name} hasn't clocked out yet.`)
    }
    if (row.state === "in_review") {
      throw conflict("hours_in_review", `Approve ${row.name}'s hours first, then mark them paid.`)
    }
    await sql()`update assignments set paid_at = now(), paid_cents = ${row.amountCents}
                where id = ${assignmentId} and event_id = ${eventId}`
  }
  if (patch.paid === false) {
    await sql()`update assignments set paid_at = null, paid_cents = null
                where id = ${assignmentId} and event_id = ${eventId}`
  }
  if (patch.tips !== undefined) {
    await sql()`update assignments set tips = ${patch.tips}
                where id = ${assignmentId} and event_id = ${eventId}`
  }
  return sheetOf(ctx.tenantId, eventId)
}

/** Marks every approved, unpaid shift of the event paid. */
export async function markAllEventPaid(adminId: string, eventId: string): Promise<EventPay> {
  const ctx = await adminCtx(adminId)
  const sheet = await sheetOf(ctx.tenantId, eventId)
  const pending = sheet.rows.filter((row) => row.state === "pending")
  if (pending.length === 0) throw conflict("nothing_pending", "Nothing is waiting to be paid.")
  const payload = JSON.stringify(
    pending.map((row) => ({ id: row.assignmentId, cents: row.amountCents })),
  )
  await sql()`update assignments a set paid_at = now(), paid_cents = x.cents
              from jsonb_to_recordset(${payload}::jsonb) as x(id uuid, cents int)
              where a.id = x.id and a.event_id = ${eventId}`
  return sheetOf(ctx.tenantId, eventId)
}
