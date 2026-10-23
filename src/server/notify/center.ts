// The notification center read model, shared by the staff and admin apps: rows grouped by venue-local
// day with a relative stamp, and the unread count that drives the bell.
import type { Notifications } from "@/lib/data/staff/schemas"
import { calendarDaysBetween, formatStamp } from "@/lib/time/labels"

type Item = Notifications["groups"][number]["items"][number]

export type NoticeRow = {
  id: string
  icon: Item["icon"]
  tone: Item["tone"]
  title: string
  body: string
  href: string
  created_at: Date
  read_at: Date | null
}

export function buildCenter(list: NoticeRow[], tz: string, now: Date): Notifications {
  const toItem = (row: NoticeRow): Item => ({
    id: row.id,
    icon: row.icon,
    tone: row.tone,
    title: row.title,
    body: row.body,
    time: formatStamp(row.created_at, now, tz),
    href: row.href,
    unread: row.read_at === null,
  })
  const isToday = (row: NoticeRow) => calendarDaysBetween(row.created_at, now, tz) === 0
  const groups = [
    { label: "TODAY", items: list.filter(isToday).map(toItem) },
    { label: "EARLIER", items: list.filter((row) => !isToday(row)).map(toItem) },
  ].filter((group) => group.items.length > 0)
  return { groups, unread: list.filter((row) => row.read_at === null).length }
}
