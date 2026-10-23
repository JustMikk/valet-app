// Notification center (product spec §11.3). Most rows are written by the events that cause them;
// "Clock-in is open" is derived from the clock, so it is created on first sight, once per shift.
import type { Notifications } from "@/lib/data/staff/schemas"
import { calendarDaysBetween, formatStamp, formatTime } from "@/lib/time/labels"
import { deriveShiftMode } from "@/lib/time/shift-mode"

import { rows, sql } from "../db/client"
import type { ShiftRow } from "./shift-data"
import { tenantTimezone } from "./tenant"

type NotificationRow = {
  id: string
  icon: Notifications["groups"][number]["items"][number]["icon"]
  tone: Notifications["groups"][number]["items"][number]["tone"]
  title: string
  body: string
  href: string
  created_at: Date
  read_at: Date | null
}

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
  await sql()`insert into notifications (staff_id, dedupe_key, icon, tone, title, body, href, created_at)
              values (${staffId}, ${`clockin:${shift.assignment_id}`}, 'timer', 'accent',
                      'Clock-in is open', ${body}, '/staff', ${opens.toISOString()})
              on conflict (staff_id, dedupe_key) where dedupe_key is not null do nothing`
}

export async function getNotifications(staffId: string, now: Date): Promise<Notifications> {
  const [tz, list] = await Promise.all([
    tenantTimezone(staffId),
    rows<NotificationRow>(
      sql()`select id, icon, tone, title, body, href, created_at, read_at
            from notifications where staff_id = ${staffId}
            order by created_at desc limit 50`,
    ),
  ])
  const toItem = (row: NotificationRow) => ({
    id: row.id,
    icon: row.icon,
    tone: row.tone,
    title: row.title,
    body: row.body,
    time: formatStamp(row.created_at, now, tz),
    href: row.href,
    unread: row.read_at === null,
  })
  const today = list.filter((row) => calendarDaysBetween(row.created_at, now, tz) === 0)
  const earlier = list.filter((row) => calendarDaysBetween(row.created_at, now, tz) !== 0)
  const groups = [
    { label: "TODAY", items: today.map(toItem) },
    { label: "EARLIER", items: earlier.map(toItem) },
  ].filter((group) => group.items.length > 0)
  return { groups, unread: list.filter((row) => row.read_at === null).length }
}

export async function markAllRead(staffId: string): Promise<void> {
  await sql()`update notifications set read_at = now() where staff_id = ${staffId} and read_at is null`
}
