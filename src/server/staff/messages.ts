// The single dispatch thread (product spec §11.1): direct messages, broadcasts that may carry a
// claimable event, and the worker's own messages with a delivery / read marker.
import type { ChatItem } from "@/lib/data/staff/schemas"
import { formatCompactRange, formatDate, formatTime, calendarDaysBetween } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { tenantTimezone } from "./tenant"

type MessageRow = {
  id: string
  sender: "staff" | "dispatch" | "broadcast"
  sender_name: string | null
  body: string
  ref_label: string | null
  image_label: string | null
  created_at: Date
  read_at: Date | null
  event_title: string | null
  event_starts: Date | null
  event_ends: Date | null
  event_tz: string | null
  event_spots: string | null
}

/** How long dispatch takes to open a message in the demo before it shows as read. */
const READ_AFTER_MS = 2500

function senderFirstName(name: string | null): string {
  return name?.split(" · ")[0]?.trim() || "Dispatch"
}

export async function getMessages(staffId: string, now: Date): Promise<ChatItem[]> {
  await sql()`update messages
              set read_at = created_at + (${READ_AFTER_MS} * interval '1 millisecond')
              where staff_id = ${staffId} and sender = 'staff' and read_at is null
                and created_at <= now() - (${READ_AFTER_MS} * interval '1 millisecond')`
  const [tz, messages] = await Promise.all([
    tenantTimezone(staffId),
    rows<MessageRow>(
      sql()`select m.id, m.sender, m.sender_name, m.body, m.ref_label, m.image_label,
              m.created_at, m.read_at,
              e.title as event_title, e.starts_at as event_starts, e.ends_at as event_ends,
              v.timezone as event_tz,
              (select count(*) from assignments a
                 where a.event_id = e.id and a.status = 'open') as event_spots
            from messages m
            left join events e on e.id = m.event_id
            left join venues v on v.id = e.venue_id
            where m.staff_id = ${staffId}
            order by m.created_at, m.id
            limit 200`,
    ),
  ])
  const readBy = senderFirstName(
    messages.findLast((message) => message.sender === "dispatch")?.sender_name ?? null,
  )

  const items: ChatItem[] = []
  let lastDay = ""
  for (const message of messages) {
    const day = formatDate(message.created_at, tz)
    if (day !== lastDay) {
      lastDay = day
      const today = calendarDaysBetween(message.created_at, now, tz) === 0
      items.push({
        kind: "day",
        id: `day-${day}`,
        text: `${today ? "TODAY · " : ""}${day.toUpperCase()}`,
      })
    }
    const time = formatTime(message.created_at, tz)
    const event =
      message.event_title && message.event_starts && message.event_ends && message.event_tz
        ? {
            title: message.event_title,
            meta: `${formatDate(message.event_starts, message.event_tz)} · ${formatCompactRange(message.event_starts, message.event_ends, message.event_tz)} · ${Number(message.event_spots ?? 0)} spots`,
          }
        : undefined
    items.push({
      kind: "message",
      id: message.id,
      from:
        message.sender === "staff" ? "me" : message.sender === "broadcast" ? "broadcast" : "them",
      ...(message.sender === "staff" ? {} : { who: message.sender_name ?? undefined }),
      text: message.body,
      ...(message.ref_label ? { ref: message.ref_label } : {}),
      ...(message.image_label ? { img: message.image_label } : {}),
      ...(event ? { event } : {}),
      meta:
        message.sender === "staff"
          ? `${time} · ${message.read_at ? `Read by ${readBy}` : "Delivered"}`
          : message.sender === "broadcast"
            ? `${time} · broadcast · replies come here`
            : time,
    })
  }
  return items
}

export async function sendMessage(staffId: string, text: string): Promise<ChatItem> {
  const [created] = await rows<{ id: string; created_at: Date }>(
    sql()`insert into messages (tenant_id, staff_id, sender, sender_name, body, delivered_at)
          select s.tenant_id, s.id, 'staff', s.name, ${text}, now() from staff s
          where s.id = ${staffId}
          returning id, created_at`,
  )
  const tz = await tenantTimezone(staffId)
  return {
    kind: "message",
    id: created.id,
    from: "me",
    text,
    meta: `${formatTime(created.created_at, tz)} · Delivered`,
  }
}
