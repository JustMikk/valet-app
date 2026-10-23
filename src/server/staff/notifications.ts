// Notification center (product spec §11.3). Most rows are written by the events that cause them;
// "Clock-in is open" is derived from the clock, so it is created on first sight, once per shift.
import type { Notifications } from "@/lib/data/staff/schemas"
import { formatTime } from "@/lib/time/labels"
import { deriveShiftMode } from "@/lib/time/shift-mode"

import { rows, sql } from "../db/client"
import { buildCenter, type NoticeRow } from "../notify/center"
import { pushToStaff } from "../notify"
import type { ShiftRow } from "./shift-data"
import { tenantTimezone } from "./tenant"

/** Creates the "Clock-in is open" row the first time the window is seen open (idempotent). */
export async function ensureClockInNotification(staffId: string, shift: ShiftRow, now: Date) {
  const opens = new Date(shift.starts_at.getTime() - shift.window_min * 60_000)
  const mode = deriveShiftMode(
    {
      clockInOpensAt: opens,
      endsAt: shift.ends_at,
      clockedInAt: shift.clocked_in_at,
      clockedOutAt: shift.clocked_out_at,
    },
    now.getTime(),
  )
  if (mode !== "due") return
  const body = `${shift.title} starts at ${formatTime(shift.starts_at, shift.timezone)}. Tap to clock in.`
  const created = await rows<{ id: string }>(
    sql()`insert into notifications (staff_id, dedupe_key, icon, tone, title, body, href, created_at)
          values (${staffId}, ${`clockin:${shift.assignment_id}`}, 'timer', 'accent',
                  'Clock-in is open', ${body}, '/staff', ${opens.toISOString()})
          on conflict (staff_id, dedupe_key) where dedupe_key is not null do nothing
          returning id`,
  )
  if (created.length > 0) {
    await pushToStaff([
      { staffId, icon: "timer", tone: "accent", title: "Clock-in is open", body, href: "/staff" },
    ])
  }
}

export async function getNotifications(staffId: string, now: Date): Promise<Notifications> {
  const [tz, list] = await Promise.all([
    tenantTimezone(staffId),
    rows<NoticeRow>(
      sql()`select id, icon, tone, title, body, href, created_at, read_at
            from notifications where staff_id = ${staffId}
            order by created_at desc limit 50`,
    ),
  ])
  return buildCenter(list, tz, now)
}

export async function markAllRead(staffId: string): Promise<void> {
  await sql()`update notifications set read_at = now() where staff_id = ${staffId} and read_at is null`
}
