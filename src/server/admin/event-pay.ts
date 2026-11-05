// The event pay sheet (ADR-022): each valet's hours for one event at the event's own rate, marked
// paid and tipped here. Only approved hours can be marked paid; what was paid stays as paid.
import type { EventPay, PayMarkPatch } from "@/lib/data/admin/ops-schemas"
import { paySheet, type PayInput } from "@/lib/pay/pay-sheet"
import { formatDate, formatTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { conflict, notFound } from "../http/handler"
import { adminCtx } from "./common"

type EventRow = {
  id: string
  name: string
  venue: string
  tz: string
  starts_at: Date
  ends_at: Date
  pay_rate_cents: number
}

type ShiftRow = {
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
    sql()`select e.id, coalesce(nullif(e.kind, ''), e.title) as name, v.name as venue,
                 v.timezone as tz, e.starts_at, e.ends_at, e.pay_rate_cents
          from events e join venues v on v.id = e.venue_id
          where e.id = ${eventId} and e.tenant_id = ${tenantId}`,
  )
  if (!event) throw notFound("Event not found.")
  return event
}

async function sheetOf(tenantId: string, eventId: string): Promise<EventPay> {
  const event = await eventOf(tenantId, eventId)
  const shifts = await rows<ShiftRow>(
    sql()`select a.id as assignment_id, s.id as staff_id, s.name, a.clocked_in_at,
                 a.clocked_out_at, a.hours_status, a.paid_cents, a.tips
          from assignments a join staff s on s.id = a.staff_id
          where a.event_id = ${eventId}`,
  )
  const inputs: PayInput[] = shifts.map((shift) => ({
    assignmentId: shift.assignment_id,
    staffId: shift.staff_id,
    name: shift.name,
    clockedInAt: shift.clocked_in_at,
    clockedOutAt: shift.clocked_out_at,
    approved: shift.hours_status === "approved",
    paidCents: shift.paid_cents,
    tips: shift.tips,
  }))
  const sheet = paySheet(inputs, event.pay_rate_cents)
  return {
    eventId: event.id,
    venue: event.venue,
    name: event.name,
    date: formatDate(event.starts_at, event.tz),
    start: formatTime(event.starts_at, event.tz),
    end: formatTime(event.ends_at, event.tz),
    rateCents: event.pay_rate_cents,
    rows: sheet.rows,
    totals: sheet.totals,
  }
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
