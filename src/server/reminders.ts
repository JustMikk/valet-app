// Shift reminders, 24 h and 1 h before a shift (ADR-026): in the app, by push and by text. An outside
// cron calls /api/cron/reminders every 5 minutes; a throttled run after Live Board and clock requests
// is the backstop. Each reminder is claimed by inserting its shift_reminders row (assignment, offset,
// start), so concurrent sweeps send it once, and a rescheduled shift gets fresh reminders.
import { after } from "next/server"

import { formatDate, formatDayWord, formatRange, formatTime } from "@/lib/time/labels"

import { rows, sql } from "./db/client"
import { notifyStaff, type StaffNotice } from "./notify"
import { textStaff, type StaffText } from "./sms"

const HOUR = 60 * 60 * 1000
export type ReminderOffset = 24 | 1

/**
 * Which reminders are due now: each from its mark until the next one (24 h until 1 h before, 1 h
 * until the start), so a late sweep still sends and a stale one is dropped. A reminder whose mark
 * passed before the person got the shift is skipped: they were just told.
 */
export function dueOffsets(start: Date, since: Date, now: Date): ReminderOffset[] {
  const windows: [ReminderOffset, number, number][] = [
    [24, start.getTime() - 24 * HOUR, start.getTime() - HOUR],
    [1, start.getTime() - HOUR, start.getTime()],
  ]
  return windows
    .filter(([, from, until]) => now.getTime() >= from && now.getTime() < until)
    .filter(([, from]) => since.getTime() <= from)
    .map(([offset]) => offset)
}

type Candidate = {
  assignment_id: string
  staff_id: string
  title: string
  starts_at: Date
  ends_at: Date
  since: Date
  window_min: number
  address: string
  tz: string
}

/** Sends every reminder due now. Returns how many went out (in the app; texts as configured). */
export async function sendDueReminders(now: Date = new Date()): Promise<number> {
  const candidates = await rows<Candidate>(
    sql()`select a.id as assignment_id, a.staff_id, e.title, e.starts_at, e.ends_at,
            coalesce(a.assigned_at, a.claimed_at, a.created_at) as since,
            e.clock_in_window_min as window_min, v.address, v.timezone as tz
          from assignments a
          join events e on e.id = a.event_id
          join venues v on v.id = e.venue_id
          join staff s on s.id = a.staff_id
          where e.status = 'published' and a.staff_id is not null and a.clocked_in_at is null
            and s.active and s.notify_remind
            and e.starts_at > ${now.toISOString()}
            and e.starts_at <= ${new Date(now.getTime() + 24 * HOUR).toISOString()}`,
  )

  const notices: StaffNotice[] = []
  const texts: StaffText[] = []
  for (const row of candidates) {
    for (const offset of dueOffsets(row.starts_at, row.since, now)) {
      const [claimed] = await rows<{ assignment_id: string }>(
        sql()`insert into shift_reminders (assignment_id, offset_hours, starts_at)
              values (${row.assignment_id}, ${offset}, ${row.starts_at.toISOString()})
              on conflict do nothing returning assignment_id`,
      )
      if (!claimed) continue
      const reminder = remind(row, offset, now)
      notices.push(reminder.notice)
      texts.push(reminder.text)
    }
  }
  await Promise.all([notifyStaff(notices), textStaff(texts)])
  return notices.length
}

function remind(row: Candidate, offset: ReminderOffset, now: Date) {
  const path = `/staff/shifts/detail?id=${row.assignment_id}`
  const range = formatRange(row.starts_at, row.ends_at, row.tz)
  const start = formatTime(row.starts_at, row.tz)
  const day = formatDayWord(row.starts_at, now, row.tz)
  const dayWord = day === "Today" || day === "Tomorrow" ? day.toLowerCase() : `on ${day}`
  const notice: StaffNotice = {
    staffId: row.staff_id,
    icon: "schedule",
    tone: "info",
    title: "Shift reminder",
    body:
      offset === 24
        ? `${row.title} ${dayWord}, ${range}`
        : `${row.title} starts at ${start}, ${formatDate(row.starts_at, row.tz)}`,
    href: path,
  }
  const opens = formatTime(new Date(row.starts_at.getTime() - row.window_min * 60_000), row.tz)
  const text: StaffText =
    offset === 24
      ? {
          staffId: row.staff_id,
          path,
          copy: {
            kind: "reminder24",
            title: row.title,
            day: dayWord,
            range,
            address: row.address,
          },
        }
      : {
          staffId: row.staff_id,
          path,
          copy: { kind: "reminder1", title: row.title, start, opens },
        }
  return { notice, text }
}

const BACKSTOP_EVERY_MS = 60_000
let lastBackstop = 0

/**
 * The backstop for a missed cron tick: at most once a minute per server, after the response, so it
 * never slows the request that triggered it. Never throws.
 */
export function remindersBackstop(now: Date = new Date()): void {
  if (now.getTime() - lastBackstop < BACKSTOP_EVERY_MS) return
  lastBackstop = now.getTime()
  try {
    after(async () => {
      try {
        await sendDueReminders(new Date())
      } catch (error) {
        console.warn("Reminder backstop failed", error)
      }
    })
  } catch (error) {
    // Outside a request (no `after` scope): skip; the cron will send.
    console.warn("Reminder backstop skipped", error)
  }
}
