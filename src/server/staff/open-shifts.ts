// Open shifts: the first-come feed and the claim (product spec §7.8). The claim is one atomic
// statement, so two workers racing for the last spot cannot both win.
import type { ClaimResult, OpenShift } from "@/lib/data/staff/schemas"
import {
  calendarDaysBetween,
  formatCompactRange,
  formatDate,
  formatDayWord,
  formatDuration,
  formatRange,
} from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { isUniqueViolation } from "../db/errors"
import { conflict, notFound } from "../http/handler"
import { loadShifts, type ShiftRow } from "./shift-data"

type OpenRow = {
  event_id: string
  title: string
  starts_at: Date
  ends_at: Date
  timezone: string
  spots: string
}

export type OpenEvent = { id: string; title: string; spots: number; item: OpenShift }

type Span = { starts_at: Date; ends_at: Date }

const overlaps = (a: Span, b: Span) => a.starts_at < b.ends_at && a.ends_at > b.starts_at

function conflictWith(event: Span, held: ShiftRow[]): ShiftRow | undefined {
  return held.find((own) => overlaps(event, own))
}

/** Events that still have a free slot and have not started, soonest first. */
export async function listOpenEvents(staffId: string, now: Date): Promise<OpenEvent[]> {
  const [events, held] = await Promise.all([
    rows<OpenRow>(
      sql()`select e.id as event_id, e.title, e.starts_at, e.ends_at, v.timezone,
              count(*) filter (where a.status = 'open') as spots
            from events e
            join venues v on v.id = e.venue_id
            join assignments a on a.event_id = e.id
            where e.status = 'published' and e.starts_at > now()
            group by e.id, v.timezone
            having count(*) filter (where a.status = 'open') > 0
            order by e.starts_at`,
    ),
    loadShifts(staffId, "upcoming", { limit: 50 }),
  ])
  return events.map((event) => {
    const tz = event.timezone
    const clash = conflictWith(event, held)
    const today = calendarDaysBetween(now, event.starts_at, tz) === 0
    const spots = Number(event.spots)
    return {
      id: event.event_id,
      title: event.title,
      spots,
      item: {
        id: event.event_id,
        date: `${formatDate(event.starts_at, tz).toUpperCase()}${today ? " · TONIGHT" : ""}`,
        venue: event.title,
        time: `${formatRange(event.starts_at, event.ends_at, tz)} · ${formatDuration(event.ends_at.getTime() - event.starts_at.getTime())}`,
        spots,
        ...(clash
          ? {
              conflict: `Overlaps your ${clash.title} shift (${formatCompactRange(clash.starts_at, clash.ends_at, tz)})`,
            }
          : {}),
      },
    }
  })
}

export async function listOpenShifts(staffId: string, now: Date): Promise<OpenShift[]> {
  return (await listOpenEvents(staffId, now)).map((event) => event.item)
}

type EventRow = { title: string; starts_at: Date; ends_at: Date; timezone: string; status: string }

export async function claimShift(
  staffId: string,
  eventId: string,
  now: Date,
): Promise<ClaimResult> {
  const [event] = await rows<EventRow>(
    sql()`select e.title, e.starts_at, e.ends_at, e.status, v.timezone
          from events e join venues v on v.id = e.venue_id where e.id = ${eventId}`,
  )
  if (!event || event.status !== "published") throw notFound("That shift is no longer available.")
  if (event.starts_at <= now) {
    throw conflict("event_started", "That event has already started.")
  }

  const tz = event.timezone
  const base = {
    venue: event.title,
    dateLabel: formatDate(event.starts_at, tz),
    timeLabel: formatRange(event.starts_at, event.ends_at, tz),
  }

  const held = await loadShifts(staffId, "upcoming", { limit: 50 })
  const clash = conflictWith(event, held)
  const overlapResult = (own: ShiftRow): ClaimResult => ({
    outcome: "overlap",
    ...base,
    conflict: {
      venue: own.title,
      dayWord: formatDayWord(own.starts_at, now, tz),
      range: formatRange(own.starts_at, own.ends_at, tz),
      isToday: calendarDaysBetween(now, own.starts_at, tz) === 0,
    },
  })
  if (clash) return overlapResult(clash)

  try {
    const claimed = await rows<{ id: string }>(
      sql()`with slot as (
              select a.id from assignments a
              where a.event_id = ${eventId} and a.status = 'open'
              order by a.created_at, a.id
              limit 1
              for update of a skip locked
            )
            update assignments a
              set staff_id = ${staffId}, status = 'claimed', claimed_at = now()
              from slot where a.id = slot.id
            returning a.id`,
    )
    return { outcome: claimed.length > 0 ? "claimed" : "filled", ...base }
  } catch (error) {
    // The unique (event, staff) index: a concurrent claim for the same event by this person.
    if (isUniqueViolation(error)) {
      const [own] = (await loadShifts(staffId, "upcoming", { limit: 50 })).filter((shift) =>
        overlaps(event, shift),
      )
      if (own) return overlapResult(own)
    }
    throw error
  }
}
