// Events (product spec §7.6): the list, one event with its crew, creating, cancelling, and filling
// open spots. Every change that touches a worker also tells them.
import type {
  AssignResult,
  AvailableStaff,
  EventCard,
  EventDetail,
  EventList,
  EventState,
  EventTab,
  NewEventRequest,
  RosterRow,
} from "@/lib/data/admin/schemas"
import type { AddSlotResult, BroadcastResult } from "@/lib/data/admin/ops-schemas"
import { ADMIN_STATUS } from "@/lib/status/admin"
import {
  calendarDaysBetween,
  formatCompactRange,
  formatCompactTime,
  formatDate,
  formatRange,
  formatTime,
  formatWeekday,
  zonedInstant,
} from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { isUniqueViolation } from "../db/errors"
import { badRequest, conflict, notFound } from "../http/handler"
import { adminCtx, initialsOf, notifyStaff, type AdminCtx } from "./common"
import { classifySlot, loadSlots } from "./slots"

type EventRow = {
  id: string
  title: string
  kind: string
  status: "draft" | "published" | "cancelled"
  starts_at: Date
  ends_at: Date
  venue: string
  timezone: string
  slots: string
  confirmed: string
  on_site: string
}

function stateOf(row: EventRow, now: Date): EventState {
  const open = Number(row.slots) - Number(row.confirmed)
  if (row.status === "draft") return "draft"
  if (now >= row.starts_at && now < row.ends_at) return "live"
  return open > 0 ? "short" : "full"
}

/** "TODAY · FRI OCT 23", "SAT OCT 24", then "THIS WEEK" / "NEXT WEEK" / "LATER". */
function dayLabel(row: EventRow, now: Date, past: boolean): string {
  const tz = row.timezone
  const days = calendarDaysBetween(now, row.starts_at, tz)
  const caps = formatDate(row.starts_at, tz).toUpperCase()
  if (past) return caps
  if (days <= 0) return `TODAY · ${caps}`
  if (days === 1) return caps
  if (days < 7) return "THIS WEEK"
  return days < 14 ? "NEXT WEEK" : "LATER"
}

function timeLabel(row: EventRow, now: Date): string {
  const tz = row.timezone
  const days = calendarDaysBetween(now, row.starts_at, tz)
  return days <= 1
    ? formatTime(row.starts_at, tz)
    : `${formatWeekday(row.starts_at, tz)} ${formatCompactTime(row.starts_at, tz)}`
}

export async function listEvents(adminId: string, tab: EventTab, now: Date): Promise<EventList> {
  const ctx = await adminCtx(adminId)
  const events = await rows<EventRow>(
    sql()`select e.id, e.title, e.kind, e.status, e.starts_at, e.ends_at, v.name as venue, v.timezone,
            count(a.id) as slots, count(a.staff_id) as confirmed,
            count(a.id) filter (where a.clocked_in_at is not null and a.clocked_out_at is null) as on_site
          from events e
          join venues v on v.id = e.venue_id
          left join assignments a on a.event_id = e.id
          where e.tenant_id = ${ctx.tenantId} and e.status <> 'cancelled'
          group by e.id, v.name, v.timezone
          order by e.starts_at`,
  )

  const upcoming = events.filter((e) => e.ends_at > now)
  const past = events.filter((e) => e.ends_at <= now && e.status === "published").reverse()
  const states = new Map(events.map((e) => [e.id, stateOf(e, now)]))
  const chosen =
    tab === "past"
      ? past
      : tab === "short"
        ? upcoming.filter((e) => states.get(e.id) === "short")
        : tab === "draft"
          ? upcoming.filter((e) => e.status === "draft")
          : upcoming

  const days: EventList["days"] = []
  for (const row of chosen) {
    const label = dayLabel(row, now, tab === "past")
    const card: EventCard = {
      id: row.id,
      venue: row.venue,
      kind: row.kind,
      time: timeLabel(row, now),
      need: Number(row.slots),
      confirmed: Number(row.confirmed),
      onSite: Number(row.on_site),
      state: states.get(row.id) ?? "full",
    }
    const day = days.at(-1)
    if (day?.label === label) day.items.push(card)
    else days.push({ label, items: [card] })
  }

  return {
    days,
    upcoming: upcoming.length,
    short: upcoming.filter((e) => states.get(e.id) === "short").length,
    drafts: upcoming.filter((e) => e.status === "draft").length,
  }
}

type DetailRow = {
  id: string
  title: string
  kind: string
  status: "draft" | "published" | "cancelled"
  starts_at: Date
  ends_at: Date
  instructions: string
  venue_id: string
  venue: string
  short_address: string
  timezone: string
}

export async function getEvent(adminId: string, eventId: string, now: Date): Promise<EventDetail> {
  const ctx = await adminCtx(adminId)
  const [event] = await rows<DetailRow>(
    sql()`select e.id, e.title, e.kind, e.status, e.starts_at, e.ends_at, e.instructions,
            e.venue_id, v.name as venue, v.short_address, v.timezone
          from events e join venues v on v.id = e.venue_id
          where e.id = ${eventId} and e.tenant_id = ${ctx.tenantId}`,
  )
  if (!event) throw notFound("Event not found.")
  const tz = event.timezone
  const slots = (await loadSlots(ctx.tenantId, eventId)).map((row) => ({
    row,
    slot: classifySlot(row, now),
  }))

  const roster: RosterRow[] = []
  const openSlots: string[] = []
  for (const { row, slot } of slots) {
    if (slot.state === "open") {
      openSlots.push(slot.meta)
      continue
    }
    const at = (d: Date | null) => (d ? formatTime(d, tz) : "")
    const f = slot.facts
    const base = { id: slot.id, initials: initialsOf(slot.name), name: slot.name, tel: f.tel }
    if (slot.state === "waiting") {
      roster.push({
        ...base,
        detail: `Requested ${at(row.server_at)} · ${row.distance_m ?? 0} m${f.note ? `, ${f.note}` : ""}`,
        status: ADMIN_STATUS.approval,
        action: "Review",
      })
    } else if (slot.state === "late") {
      roster.push({
        ...base,
        detail: `Starts ${at(event.starts_at)} · not clocked in`,
        status: ADMIN_STATUS.late(f.lateMin ?? 0),
        action: "Call",
      })
    } else if (slot.state === "due" || slot.state === "upcoming") {
      roster.push({
        ...base,
        detail:
          slot.state === "due" ? `Starts ${at(event.starts_at)} · not clocked in` : "Confirmed",
        status: ADMIN_STATUS.expected,
      })
    } else {
      roster.push({
        ...base,
        detail: `In ${at(row.device_at)} · ${row.distance_m ?? 0} m${row.selfie ? " · selfie ok" : ""}${slot.state === "override" ? " · approved override" : ""}`,
        status: row.clocked_out_at ? ADMIN_STATUS.clockedOut : ADMIN_STATUS.onSite,
      })
    }
  }

  const count = (state: string) => slots.filter(({ slot }) => slot.state === state).length
  const live = now >= event.starts_at && now < event.ends_at && event.status === "published"
  const date = formatDate(event.starts_at, tz)
  const badge =
    event.status === "cancelled"
      ? { label: "Cancelled", live: false }
      : event.status === "draft"
        ? { label: `Draft · ${date}`, live: false }
        : live
          ? { label: `Live now · ${date}`, live: true }
          : event.ends_at <= now
            ? { label: `Past · ${date}`, live: false }
            : { label: `Upcoming · ${date}`, live: false }

  return {
    id: event.id,
    venue: event.venue,
    venueId: event.venue_id,
    badge,
    summary: `${event.kind} · ${formatRange(event.starts_at, event.ends_at, tz)} · ${event.short_address}`,
    instructions: event.instructions,
    stats: [
      { n: count("onsite") + count("flagged") + count("override"), label: "On site", tone: "ok" },
      { n: count("waiting") + count("late"), label: "Need you", tone: "warn" },
      { n: count("open"), label: "Unfilled", tone: "fg" },
    ],
    roster,
    openSlots,
    confirmedCount: slots.filter(({ slot }) => slot.staffId).length,
    cancelled: event.status === "cancelled",
  }
}

type VenueFacts = {
  id: string
  name: string
  timezone: string
  contact_name: string
  contact_tel: string
  contact_text: string
  dress_code: string
}

/** Staff who are active, joined, and free for the whole event: who could take an open spot. */
async function freeStaff(
  tenantId: string,
  eventId: string,
  venueId: string,
  starts: Date,
  ends: Date,
) {
  return rows<{ id: string; name: string; here: string; notify_open: boolean }>(
    sql()`select s.id, s.name, s.notify_open,
            (select count(*) from assignments a2 join events e2 on e2.id = a2.event_id
              where a2.staff_id = s.id and e2.venue_id = ${venueId} and e2.ends_at < now()) as here
          from staff s
          where s.tenant_id = ${tenantId} and s.active and s.onboarded_at is not null
            and not exists (
              select 1 from assignments a join events e on e.id = a.event_id
              where a.staff_id = s.id and e.status <> 'cancelled' and a.status <> 'open'
                and (e.id = ${eventId}
                     or (e.starts_at < ${ends.toISOString()} and e.ends_at > ${starts.toISOString()}))
            )
          order by here desc, s.name`,
  )
}

export async function availableStaff(
  adminId: string,
  eventId: string,
  now: Date,
): Promise<AvailableStaff> {
  const ctx = await adminCtx(adminId)
  const [event] = await rows<{ venue_id: string; starts_at: Date; ends_at: Date; tz: string }>(
    sql()`select e.venue_id, e.starts_at, e.ends_at, v.timezone as tz
          from events e join venues v on v.id = e.venue_id
          where e.id = ${eventId} and e.tenant_id = ${ctx.tenantId}`,
  )
  if (!event) throw notFound("Event not found.")
  const today = calendarDaysBetween(now, event.starts_at, event.tz) === 0
  const free = await freeStaff(
    ctx.tenantId,
    eventId,
    event.venue_id,
    event.starts_at,
    event.ends_at,
  )
  return free.slice(0, 12).map((person) => ({
    id: person.id,
    initials: initialsOf(person.name),
    name: person.name,
    note: `${today ? "Free tonight" : "Free"}${Number(person.here) > 0 ? ` · worked here ${person.here}×` : ""}`,
  }))
}

/** Put people into open spots (the best-suited free person when none is named) and tell them. */
export async function assign(
  adminId: string,
  eventId: string,
  staffIds: string[] | undefined,
  now: Date,
): Promise<AssignResult> {
  const ctx = await adminCtx(adminId)
  const [event] = await rows<{
    title: string
    venue_id: string
    starts_at: Date
    ends_at: Date
    tz: string
    status: string
  }>(
    sql()`select e.title, e.venue_id, e.starts_at, e.ends_at, v.timezone as tz, e.status
          from events e join venues v on v.id = e.venue_id
          where e.id = ${eventId} and e.tenant_id = ${ctx.tenantId}`,
  )
  if (!event) throw notFound("Event not found.")
  if (event.status === "cancelled") throw conflict("cancelled", "That event is cancelled.")

  let chosen = staffIds
  if (!chosen || chosen.length === 0) {
    const [best] = await freeStaff(
      ctx.tenantId,
      eventId,
      event.venue_id,
      event.starts_at,
      event.ends_at,
    )
    if (!best) throw conflict("nobody_free", "Nobody is free for that event.")
    chosen = [best.id]
  }

  const names: string[] = []
  const notices = []
  for (const staffId of chosen) {
    try {
      const [done] = await rows<{ name: string }>(
        sql()`with slot as (
                select a.id from assignments a
                where a.event_id = ${eventId} and a.status = 'open'
                order by a.created_at, a.id limit 1 for update of a skip locked
              ), taken as (
                update assignments a
                  set staff_id = ${staffId}, status = 'confirmed',
                      assigned_by = ${ctx.adminId}, assigned_at = ${now.toISOString()}
                  from slot where a.id = slot.id
                  returning a.id
              )
              select s.name from staff s, taken where s.id = ${staffId} and s.tenant_id = ${ctx.tenantId}`,
      )
      if (!done) break
      names.push(done.name)
      notices.push({
        staffId,
        icon: "event_available",
        tone: "info" as const,
        title: "You were assigned",
        body: `${event.title}, ${formatDate(event.starts_at, event.tz)}`,
        href: "/staff/shifts",
      })
    } catch (error) {
      // Already on this event: skip them rather than fail the whole batch.
      if (!isUniqueViolation(error)) throw error
    }
  }
  await notifyStaff(notices)
  if (names.length === 0) throw conflict("no_open_spot", "There is no open spot left to fill.")
  return { assigned: names.length, names }
}

export async function addSlot(adminId: string, eventId: string): Promise<AddSlotResult> {
  const ctx = await adminCtx(adminId)
  const [added] = await rows<{ crew: number }>(
    sql()`with e as (
            select id from events where id = ${eventId} and tenant_id = ${ctx.tenantId}
              and status <> 'cancelled'
          ), slot as (
            insert into assignments (event_id) select id from e returning event_id
          )
          update events set crew_size = (select count(*) from assignments where event_id = ${eventId})
            where id in (select event_id from slot) returning crew_size as crew`,
  )
  if (!added) throw notFound("Event not found.")
  return { headcount: added.crew }
}

/** Tell eligible staff about an event's open spots (they open the Open tab to claim). */
export async function broadcastOpen(adminId: string, eventId: string): Promise<BroadcastResult> {
  const ctx = await adminCtx(adminId)
  const [event] = await rows<{
    title: string
    venue_id: string
    starts_at: Date
    ends_at: Date
    tz: string
    open: string
  }>(
    sql()`select e.title, e.venue_id, e.starts_at, e.ends_at, v.timezone as tz,
            (select count(*) from assignments a where a.event_id = e.id and a.status = 'open') as open
          from events e join venues v on v.id = e.venue_id
          where e.id = ${eventId} and e.tenant_id = ${ctx.tenantId} and e.status = 'published'`,
  )
  if (!event) throw notFound("Event not found.")
  const open = Number(event.open)
  if (open === 0) throw conflict("nothing_open", "There are no open spots to broadcast.")

  const free = (
    await freeStaff(ctx.tenantId, eventId, event.venue_id, event.starts_at, event.ends_at)
  ).filter((person) => person.notify_open)
  await notifyStaff(
    free.map((person) => ({
      staffId: person.id,
      icon: "add_circle",
      tone: "ok" as const,
      title: `New open shift · ${open} spot${open === 1 ? "" : "s"}`,
      body: `${event.title}, ${formatDate(event.starts_at, event.tz)}, ${formatCompactRange(event.starts_at, event.ends_at, event.tz)}`,
      href: "/staff/open",
    })),
  )
  return { recipients: free.length }
}

export async function cancelEvent(adminId: string, eventId: string): Promise<void> {
  const ctx = await adminCtx(adminId)
  const crew = await rows<{ staff_id: string; title: string; starts_at: Date; tz: string }>(
    sql()`select a.staff_id, e.title, e.starts_at, v.timezone as tz
          from events e join venues v on v.id = e.venue_id
          left join assignments a on a.event_id = e.id and a.staff_id is not null
          where e.id = ${eventId} and e.tenant_id = ${ctx.tenantId} and e.status <> 'cancelled'`,
  )
  if (crew.length === 0) throw notFound("Event not found or already cancelled.")
  await sql()`update events set status = 'cancelled' where id = ${eventId}`
  await notifyStaff(
    crew
      .filter((row) => row.staff_id)
      .map((row) => ({
        staffId: row.staff_id,
        icon: "event_busy",
        tone: "warn" as const,
        title: "Shift cancelled",
        body: `${row.title}, ${formatDate(row.starts_at, row.tz)}`,
        href: "/staff/shifts",
      })),
  )
}

/** Create an event (draft or published) with its open spots, optionally filling some at once. */
export async function createEvent(
  adminId: string,
  input: NewEventRequest,
  now: Date,
): Promise<{ id: string }> {
  const ctx: AdminCtx = await adminCtx(adminId)
  const [venue] = await rows<VenueFacts>(
    sql()`select id, name, timezone, contact_name, contact_tel, contact_text, dress_code
          from venues where id = ${input.venueId} and tenant_id = ${ctx.tenantId}`,
  )
  if (!venue) throw badRequest("Choose a venue.", "invalid_request")

  const [y, m, d] = input.date.split("-").map(Number)
  const [sh, sm] = input.start.split(":").map(Number)
  const [eh, em] = input.end.split(":").map(Number)
  const starts = zonedInstant(venue.timezone, { year: y, month: m, day: d, hour: sh, minute: sm })
  let ends = zonedInstant(venue.timezone, { year: y, month: m, day: d, hour: eh, minute: em })
  if (ends <= starts)
    ends = zonedInstant(venue.timezone, { year: y, month: m, day: d + 1, hour: eh, minute: em })
  if (input.publish && ends <= now)
    throw badRequest("That event is already over.", "invalid_request")

  const [created] = await rows<{ id: string }>(
    sql()`with ev as (
            insert into events (tenant_id, venue_id, title, kind, starts_at, ends_at, crew_size,
                                clock_in_window_min, contact_text, contact_name, contact_tel,
                                dress_code, instructions, status)
            select ${ctx.tenantId}, ${venue.id}, ${`${venue.name} · ${input.name}`}, ${input.name},
                   ${starts.toISOString()}, ${ends.toISOString()}, ${input.headcount},
                   t.clock_window_min, ${`Ask for ${venue.contact_name}`}, ${venue.contact_name},
                   ${venue.contact_tel}, ${venue.dress_code}, ${input.instructions ?? ""},
                   ${input.publish ? "published" : "draft"}
            from tenants t where t.id = ${ctx.tenantId}
            returning id
          ), slots as (
            insert into assignments (event_id) select ev.id from ev, generate_series(1, ${input.headcount})
            returning event_id
          )
          select id from ev`,
  )

  if (input.fill === "assign" && input.assignStaffIds?.length) {
    await assign(adminId, created.id, input.assignStaffIds, now)
  }
  if (input.publish) {
    try {
      await broadcastOpen(adminId, created.id)
    } catch {
      // Nothing open (everyone was assigned): there is nobody to tell.
    }
  }
  return { id: created.id }
}
