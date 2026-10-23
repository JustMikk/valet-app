// Turns shift rows into the display-ready DTOs the screens render. Pure: `now` is passed in so the
// mapping is deterministic and testable.
import type { HomeShift, ShiftCard, ShiftDetail, UpNext } from "@/lib/data/staff/schemas"
import type { StatusSpec } from "@/lib/status/presets"
import {
  formatDate,
  formatDayNumber,
  formatDayWord,
  formatDuration,
  formatRange,
  formatTime,
  formatWeekday,
  formatWeekdayCaps,
  formatZoneShort,
  calendarDaysBetween,
} from "@/lib/time/labels"
import { deriveShiftMode } from "@/lib/time/shift-mode"

import type { ShiftRow } from "./shift-data"

const LATE_DROP_HOURS = 24

const CONFIRMED: StatusSpec = {
  tone: "subtle",
  icon: "event_available",
  filled: true,
  label: "Confirmed",
}
const CLAIMED: StatusSpec = { tone: "subtle", icon: "bolt", filled: true, label: "Claimed" }
const APPROVED: StatusSpec = { tone: "ok", icon: "check_circle", filled: true, label: "Approved" }
const IN_REVIEW: StatusSpec = {
  tone: "subtle",
  icon: "hourglass_top",
  filled: true,
  label: "In review",
}

const opensAt = (row: ShiftRow) => new Date(row.starts_at.getTime() - row.window_min * 60_000)

function facts(row: ShiftRow) {
  return {
    clockInOpensAt: opensAt(row),
    endsAt: row.ends_at,
    clockedInAt: row.clocked_in_at,
    clockedOutAt: row.clocked_out_at,
  }
}

/** "5:45 PM" when it opens today, otherwise "Sat 3:45 PM". */
function opensLabel(row: ShiftRow, now: Date): string {
  const opens = opensAt(row)
  const time = formatTime(opens, row.timezone)
  return calendarDaysBetween(now, opens, row.timezone) === 0
    ? time
    : `${formatWeekday(opens, row.timezone)} ${time}`
}

export function toHomeShift(row: ShiftRow, now: Date): HomeShift {
  const tz = row.timezone
  const range = formatRange(row.starts_at, row.ends_at, tz)
  const date = formatDate(row.starts_at, tz)
  return {
    assignmentId: row.assignment_id,
    venue: row.title,
    address: row.address,
    shortAddress: row.short_address,
    mapsUrl: row.maps_url,
    venueGeo: { lat: row.lat, lng: row.lng },
    timezone: row.timezone,
    contact: { text: row.contact_text, name: row.contact_name, tel: row.contact_tel },
    dress: row.dress_code,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    clockInOpensAt: opensAt(row).toISOString(),
    windowMin: row.window_min,
    dayWord: formatDayWord(row.starts_at, now, tz),
    dateLabel: date,
    startLabel: formatTime(row.starts_at, tz),
    endLabel: formatTime(row.ends_at, tz),
    rangeLabel: range,
    whenLabel: `${date} · ${range} · venue time (${formatZoneShort(row.starts_at, tz)})`,
    opensLabel: opensLabel(row, now),
    clockedInAt: row.clocked_in_at?.toISOString() ?? null,
    clockedInLabel: row.clocked_in_at ? formatTime(row.clocked_in_at, tz) : null,
    clockedInDistanceM: row.in_distance_m,
  }
}

export function toUpNext(row: ShiftRow): UpNext {
  const tz = row.timezone
  return {
    assignmentId: row.assignment_id,
    dow: formatWeekdayCaps(row.starts_at, tz),
    day: formatDayNumber(row.starts_at, tz),
    venue: row.title,
    time: formatRange(row.starts_at, row.ends_at, tz),
  }
}

function tonightStatus(row: ShiftRow, now: Date): StatusSpec {
  const mode = deriveShiftMode(facts(row), now.getTime())
  if (mode === "onshift")
    return { tone: "strong", icon: "timer", filled: true, label: "Today · on now" }
  if (mode === "due") return { tone: "strong", icon: "timer", filled: true, label: "Clock-in open" }
  return { tone: "muted", icon: "event", filled: true, label: "Today" }
}

/** Today's shift (not yet over) opens Home, where the clock action lives. */
const isTonight = (row: ShiftRow, now: Date) =>
  row.ends_at > now && calendarDaysBetween(now, row.starts_at, row.timezone) <= 0

export function toUpcomingCard(row: ShiftRow, now: Date): ShiftCard {
  const tz = row.timezone
  const tonight = isTonight(row, now)
  return {
    id: row.assignment_id,
    status: tonight ? tonightStatus(row, now) : row.status === "claimed" ? CLAIMED : CONFIRMED,
    date: formatDate(row.starts_at, tz),
    venue: row.title,
    time: formatRange(row.starts_at, row.ends_at, tz),
    right: formatDuration(row.ends_at.getTime() - row.starts_at.getTime()),
    isTonight: tonight,
  }
}

export function toPastCard(row: ShiftRow): ShiftCard {
  const tz = row.timezone
  const worked =
    row.clocked_in_at && row.clocked_out_at
      ? {
          time: `In ${formatTime(row.clocked_in_at, tz)} · Out ${formatTime(row.clocked_out_at, tz)}`,
          right: formatDuration(row.clocked_out_at.getTime() - row.clocked_in_at.getTime()),
        }
      : null
  return {
    id: row.assignment_id,
    status: row.hours_status === "approved" && worked ? APPROVED : IN_REVIEW,
    date: formatDate(row.starts_at, tz),
    venue: row.title,
    time: worked?.time ?? formatRange(row.starts_at, row.ends_at, tz),
    right: worked?.right ?? formatDuration(row.ends_at.getTime() - row.starts_at.getTime()),
    isTonight: false,
  }
}

export function isPast(row: ShiftRow, now: Date): boolean {
  return row.status === "completed" || row.ends_at <= now
}

/** Hours until the event starts: the late-drop test (product spec §7.9). */
export function hoursUntilStart(row: ShiftRow, now: Date): number {
  return (row.starts_at.getTime() - now.getTime()) / 3_600_000
}

export function toShiftDetail(row: ShiftRow, now: Date): ShiftDetail {
  const tz = row.timezone
  const past = isPast(row, now)
  const date = formatDate(row.starts_at, tz)
  const range = formatRange(row.starts_at, row.ends_at, tz)
  const lead = past
    ? row.hours_status === "approved"
      ? APPROVED
      : IN_REVIEW
    : row.status === "claimed"
      ? CLAIMED
      : CONFIRMED
  const started = row.starts_at <= now
  return {
    id: row.assignment_id,
    status: {
      tone: "muted",
      icon: past ? lead.icon : "event_available",
      filled: true,
      label: `${lead.label} · ${date}`,
    },
    start: formatTime(row.starts_at, tz),
    title: row.title,
    when: `${range} · ${formatDuration(row.ends_at.getTime() - row.starts_at.getTime())} · venue time (${formatZoneShort(row.starts_at, tz)})`,
    clockNotice: past
      ? null
      : `Clock-in opens ${opensLabel(row, now)}, ${row.window_min} min before start.`,
    address: row.address,
    mapsUrl: row.maps_url,
    report: { text: row.contact_text, name: row.contact_name, tel: row.contact_tel },
    crew: `Crew of ${row.crew_size} attendants`,
    instructions: row.instructions,
    dropVenue: row.venue_name,
    dropWhen: `${date} · ${range}`,
    // Product spec §7.9: no drop after clocking in; an event already under way goes through dispatch.
    canDrop: !past && !row.clocked_in_at && !started,
    lateDrop: hoursUntilStart(row, now) < LATE_DROP_HOURS,
  }
}
