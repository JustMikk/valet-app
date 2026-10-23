// My shifts: list, detail and drop (product spec §7.7, §7.9).
import type {
  DropRequest,
  DropResult,
  ShiftCard,
  ShiftDetail,
  ShiftTab,
} from "@/lib/data/staff/schemas"
import { formatDate, formatRange } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { conflict, notFound } from "../http/handler"
import { loadShifts } from "./shift-data"
import { hoursUntilStart, isPast, toPastCard, toShiftDetail, toUpcomingCard } from "./shift-view"

export async function listShifts(staffId: string, tab: ShiftTab, now: Date): Promise<ShiftCard[]> {
  const shifts = await loadShifts(staffId, tab)
  return shifts.map((row) => (tab === "past" ? toPastCard(row) : toUpcomingCard(row, now)))
}

/** One shift by assignment id; with no id, the soonest upcoming shift that is not tonight's. */
export async function getShift(
  staffId: string,
  id: string | undefined,
  now: Date,
): Promise<ShiftDetail> {
  if (id) {
    const [row] = await loadShifts(staffId, "any", { assignmentId: id, limit: 1 })
    if (!row) throw notFound("Shift not found.")
    return toShiftDetail(row, now)
  }
  const upcoming = await loadShifts(staffId, "upcoming", { limit: 5 })
  const row = upcoming.find((shift) => !toUpcomingCard(shift, now).isTonight) ?? upcoming[0]
  if (!row) throw notFound("You have no upcoming shifts.")
  return toShiftDetail(row, now)
}

const LATE_DROP_HOURS = 24

export async function dropShift(
  staffId: string,
  assignmentId: string,
  input: DropRequest,
  now: Date,
): Promise<DropResult> {
  const [row] = await loadShifts(staffId, "any", { assignmentId, limit: 1 })
  if (!row) throw notFound("Shift not found.")
  if (row.clocked_in_at) {
    throw conflict("clocked_in", "You're clocked in. Clock out instead of dropping.")
  }
  if (isPast(row, now) || row.starts_at <= now) {
    throw conflict("in_progress", "This event has started. Message dispatch instead.")
  }
  const late = hoursUntilStart(row, now) < LATE_DROP_HOURS

  // One statement: the slot reopens and the drop is recorded together, or neither happens.
  const dropped = await rows<{ assignment_id: string }>(
    sql()`with reopened as (
            update assignments
              set staff_id = null, status = 'open', claimed_at = null
              where id = ${assignmentId} and staff_id = ${staffId}
                and clocked_in_at is null and status in ('confirmed', 'claimed')
              returning id
          )
          insert into drops (assignment_id, staff_id, reason, note, late)
          select id, ${staffId}, ${input.reason}, ${input.note ?? null}, ${late} from reopened
          returning assignment_id`,
  )
  if (dropped.length === 0) throw conflict("not_droppable", "This shift can't be dropped anymore.")

  const tz = row.timezone
  return {
    venue: row.venue_name,
    dateLabel: formatDate(row.starts_at, tz),
    timeLabel: formatRange(row.starts_at, row.ends_at, tz),
    late,
  }
}
