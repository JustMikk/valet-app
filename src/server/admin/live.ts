// The Live Board (product spec §9): what every event is doing right now, and the in-place actions
// a dispatcher takes without leaving it.
import type {
  DecideResult,
  Live,
  LiveEvent,
  NudgeResult,
  RemoveResult,
} from "@/lib/data/admin/ops-schemas"
import { deriveBoard, spanLabel } from "@/lib/live/model"
import {
  formatDate,
  formatRange,
  formatTime,
  formatZoneShort,
  wallTime,
  zonedInstant,
} from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { conflict, notFound } from "../http/handler"
import { adminCtx, firstName, messageStaff, notifyStaff, type AdminCtx } from "./common"
import { classifySlot, loadSlots, type SlotRow } from "./slots"

const HOUR = 3_600_000

type EventGroup = { rows: SlotRow[] }

function groupByEvent(slots: SlotRow[]): EventGroup[] {
  const groups = new Map<string, EventGroup>()
  for (const row of slots) {
    const group = groups.get(row.event_id) ?? { rows: [] }
    group.rows.push(row)
    groups.set(row.event_id, group)
  }
  return [...groups.values()]
}

function relLabel(startsInMin: number, started: boolean): string {
  if (!started) return `starts in ${spanLabel(startsInMin)}`
  const ago = -startsInMin
  return ago < 60 ? `started ${ago} min ago` : `${spanLabel(ago)} in`
}

/** Fractional hours since the local midnight of the timeline's first day. */
function hoursFrom(base: Date, instant: Date): number {
  return (instant.getTime() - base.getTime()) / HOUR
}

export function buildLive(slots: SlotRow[], now: Date): Live {
  const groups = groupByEvent(slots)
  const tz = groups[0]?.rows[0]?.timezone ?? "America/Los_Angeles"
  const earliest = groups.reduce<Date>(
    (min, g) => (g.rows[0].starts_at < min ? g.rows[0].starts_at : min),
    now,
  )
  const day = wallTime(earliest, tz)
  const base = zonedInstant(tz, {
    year: day.year,
    month: day.month,
    day: day.day,
    hour: 0,
    minute: 0,
  })

  const events: LiveEvent[] = groups.map(({ rows: group }) => {
    const head = group[0]
    const startsInMin = Math.round((head.starts_at.getTime() - now.getTime()) / 60_000)
    const live = now >= head.starts_at
    return {
      id: head.event_id,
      venue: head.title,
      time: formatRange(head.starts_at, head.ends_at, tz),
      start: hoursFrom(base, head.starts_at),
      end: hoursFrom(base, head.ends_at),
      live,
      rel: relLabel(startsInMin, live),
      startLabel: formatTime(head.starts_at, tz),
      startsInMin,
      slots: group.map((row) => classifySlot(row, now)),
    }
  })

  const from = Math.floor(Math.min(hoursFrom(base, now), ...events.map((e) => e.start)))
  const to = Math.ceil(Math.max(hoursFrom(base, now) + 1, ...events.map((e) => e.end)))
  const span = Math.min(16, Math.max(6, to - from))
  const ticks: number[] = []
  for (let t = Math.ceil(from / 2) * 2; t <= from + span; t += 2) ticks.push(t)

  return {
    events,
    timeline: { from, span, now: hoursFrom(base, now), ticks },
    zone: formatZoneShort(now, tz),
    serverNow: now.toISOString(),
  }
}

export async function getLive(adminId: string, now: Date): Promise<Live> {
  const ctx = await adminCtx(adminId)
  return buildLive(await loadSlots(ctx.tenantId), now)
}

/** How many things need the dispatcher right now: the navigation badge. */
export async function attentionCount(tenantId: string, now: Date): Promise<number> {
  const live = buildLive(await loadSlots(tenantId), now)
  return deriveBoard(live.events, {}).attention.length
}

async function ownedSlot(ctx: AdminCtx, assignmentId: string): Promise<SlotRow> {
  const slot = (await loadSlots(ctx.tenantId)).find((row) => row.assignment_id === assignmentId)
  if (slot) return slot
  // Fall back to the event of that slot (it may be outside the 14-hour board window).
  const [event] = await rows<{ event_id: string }>(
    sql()`select e.id as event_id from assignments a join events e on e.id = a.event_id
          where a.id = ${assignmentId} and e.tenant_id = ${ctx.tenantId}`,
  )
  if (!event) throw notFound("That slot no longer exists.")
  const found = (await loadSlots(ctx.tenantId, event.event_id)).find(
    (row) => row.assignment_id === assignmentId,
  )
  if (!found) throw notFound("That slot no longer exists.")
  return found
}

/** Approve (clock in at the request time) or reject an out-of-fence clock-in request (§8.5). */
export async function decideRequest(
  adminId: string,
  punchId: string,
  decision: "approve" | "reject",
  now: Date,
): Promise<DecideResult> {
  const ctx = await adminCtx(adminId)
  const [request] = await rows<{
    staff_id: string
    name: string
    title: string
    device_at: Date
    tz: string
    status: string
  }>(
    sql()`select p.staff_id, s.name, e.title, p.device_at, v.timezone as tz, p.status
          from punches p
          join staff s on s.id = p.staff_id
          join assignments a on a.id = p.assignment_id
          join events e on e.id = a.event_id
          join venues v on v.id = e.venue_id
          where p.id = ${punchId} and e.tenant_id = ${ctx.tenantId} and p.kind = 'in'`,
  )
  if (!request) throw notFound("That request no longer exists.")
  if (request.status !== "pending_approval") {
    throw conflict("already_decided", "That request was already decided.")
  }
  const at = formatTime(request.device_at, request.tz)

  if (decision === "approve") {
    // Clocked in at the time of the request: the worker is not penalised for the wait (§8.5).
    await sql()`with p as (
                  update punches set status = 'approved', decided_at = ${now.toISOString()},
                                     decided_by = ${adminId}, flagged = true,
                                     flag_reason = 'Approved override'
                  where id = ${punchId} and status = 'pending_approval'
                  returning assignment_id, device_at
                )
                update assignments a set clocked_in_at = p.device_at
                  from p where a.id = p.assignment_id and a.clocked_in_at is null`
    await notifyStaff([
      {
        staffId: request.staff_id,
        icon: "check_circle",
        tone: "ok",
        title: "Clock-in approved",
        body: `${request.title}. You're on the clock from ${at}.`,
        href: "/staff",
      },
    ])
  } else {
    await sql()`update punches set status = 'rejected', decided_at = ${now.toISOString()},
                       decided_by = ${adminId}
                where id = ${punchId} and status = 'pending_approval'`
    await notifyStaff([
      {
        staffId: request.staff_id,
        icon: "event_busy",
        tone: "warn",
        title: "Clock-in not approved",
        body: `${request.title}. Message dispatch for help.`,
        href: "/staff/inbox",
      },
    ])
  }
  return { name: request.name, atLabel: at }
}

/** A short "are you on your way?" message to someone who is late. */
export async function nudge(adminId: string, assignmentId: string): Promise<NudgeResult> {
  const ctx = await adminCtx(adminId)
  const slot = await ownedSlot(ctx, assignmentId)
  if (!slot.staff_id || !slot.staff_name)
    throw conflict("empty_slot", "That slot has no one in it.")
  const text = `Hi ${firstName(slot.staff_name)}, you're not clocked in for ${slot.title} (started ${formatTime(slot.starts_at, slot.timezone)}). Are you on your way?`
  await messageStaff(ctx, slot.staff_id, text)
  return { name: slot.staff_name }
}

/** Take someone off a slot and reopen it (§7.6.3); they are told. */
export async function removeFromSlot(
  adminId: string,
  assignmentId: string,
  now: Date,
): Promise<RemoveResult> {
  const ctx = await adminCtx(adminId)
  const slot = await ownedSlot(ctx, assignmentId)
  if (!slot.staff_id || !slot.staff_name)
    throw conflict("empty_slot", "That slot has no one in it.")
  const late = slot.starts_at.getTime() - now.getTime() < 24 * HOUR
  await sql()`with reopened as (
                update assignments
                  set staff_id = null, status = 'open', claimed_at = null,
                      assigned_at = null, assigned_by = null
                where id = ${assignmentId} and staff_id = ${slot.staff_id}
                returning id
              )
              insert into drops (assignment_id, staff_id, reason, late, removed_by)
              select id, ${slot.staff_id}, 'removed', ${late}, ${adminId} from reopened`
  await notifyStaff([
    {
      staffId: slot.staff_id,
      icon: "event_busy",
      tone: "warn",
      title: "Removed from a shift",
      body: `${slot.title}, ${formatDate(slot.starts_at, slot.timezone)}`,
      href: "/staff/shifts",
    },
  ])
  return { name: slot.staff_name }
}
