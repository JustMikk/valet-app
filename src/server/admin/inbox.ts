// The admin inbox (product spec §11): one thread per person, plus the announcements sent to groups.
import type {
  Audience,
  AudienceKey,
  Inbox,
  Thread,
  ThreadDetail,
  ThreadMessage,
} from "@/lib/data/admin/ops-schemas"
import { formatStamp, formatTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { badRequest, conflict, notFound } from "../http/handler"
import { adminCtx, firstName, initialsOf, messageStaff, notifyStaff, type AdminCtx } from "./common"

const clip = (text: string, max = 56) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

type DirectRow = {
  id: string
  name: string
  body: string
  created_at: Date
  unread: boolean
}
type BroadcastRow = {
  id: string
  audience: AudienceKey
  audience_label: string
  body: string
  created_at: Date
}

export async function getInbox(adminId: string, now: Date): Promise<Inbox> {
  const ctx = await adminCtx(adminId)
  const [direct, broadcasts] = await Promise.all([
    rows<DirectRow>(
      sql()`select s.id, s.name, m.body, m.created_at,
              exists (select 1 from messages x where x.staff_id = s.id and x.sender = 'staff'
                        and x.admin_read_at is null) as unread
            from staff s
            join lateral (select body, created_at from messages
                          where staff_id = s.id and broadcast_id is null
                          order by created_at desc limit 1) m on true
            where s.tenant_id = ${ctx.tenantId}`,
    ),
    rows<BroadcastRow>(
      sql()`select id, audience, audience_label, body, created_at from broadcasts
            where tenant_id = ${ctx.tenantId} order by created_at desc limit 20`,
    ),
  ])

  const entries: { thread: Thread; at: number }[] = [
    ...direct.map((d) => ({
      at: d.created_at.getTime(),
      thread: {
        id: d.id,
        initials: initialsOf(d.name),
        name: d.name,
        last: clip(d.body),
        time: formatStamp(d.created_at, now, ctx.tz),
        unread: d.unread,
        announcement: false,
      },
    })),
    ...broadcasts.map((b) => ({
      at: b.created_at.getTime(),
      thread: {
        id: b.id,
        initials: b.audience === "event" ? initialsOf(b.audience_label) : "",
        name: b.audience === "event" ? b.audience_label : `Announcement · ${b.audience_label}`,
        last: clip(b.body),
        time: formatStamp(b.created_at, now, ctx.tz),
        unread: false,
        announcement: b.audience !== "event",
      },
    })),
  ].sort((a, b) => b.at - a.at)

  const threads = entries.map((entry) => entry.thread)
  return { threads, unread: threads.filter((t) => t.unread).length }
}

/** Unread conversations: the Inbox badge. */
export async function unreadCount(tenantId: string): Promise<number> {
  const [row] = await rows<{ n: string }>(
    sql()`select count(distinct m.staff_id) as n from messages m join staff s on s.id = m.staff_id
          where s.tenant_id = ${tenantId} and m.sender = 'staff' and m.admin_read_at is null`,
  )
  return Number(row?.n ?? 0)
}

type MessageRow = {
  id: string
  sender: "staff" | "dispatch" | "broadcast"
  sender_name: string | null
  body: string
  created_at: Date
}

export async function getThread(adminId: string, id: string, now: Date): Promise<ThreadDetail> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{
    id: string
    name: string
    on_site: string | null
    role_label: string
  }>(
    sql()`select s.id, s.name, s.role_label,
            (select e.title from assignments a join events e on e.id = a.event_id
              where a.staff_id = s.id and a.clocked_in_at is not null and a.clocked_out_at is null
              limit 1) as on_site
          from staff s where s.id = ${id} and s.tenant_id = ${ctx.tenantId}`,
  )

  if (person) {
    const messages = await rows<MessageRow>(
      sql()`select id, sender, sender_name, body, created_at from messages
            where staff_id = ${id} and broadcast_id is null order by created_at, id`,
    )
    // Opening a conversation reads it.
    await sql()`update messages set admin_read_at = now()
                where staff_id = ${id} and sender = 'staff' and admin_read_at is null`
    return {
      id: person.id,
      name: person.name,
      initials: initialsOf(person.name),
      subtitle: person.on_site ? `On site · ${person.on_site}` : person.role_label,
      announcement: false,
      canReply: true,
      messages: messages.map((m): ThreadMessage => ({
        id: m.id,
        text: m.body,
        mine: m.sender === "dispatch",
        meta:
          m.sender === "dispatch"
            ? `${formatStamp(m.created_at, now, ctx.tz)} · ${firstName(m.sender_name ?? "Dispatch")}`
            : formatStamp(m.created_at, now, ctx.tz),
      })),
    }
  }

  const [broadcast] = await rows<BroadcastRow & { recipients: number; sender: string }>(
    sql()`select b.id, b.audience, b.audience_label, b.body, b.created_at, b.recipients, a.name as sender
          from broadcasts b join admins a on a.id = b.admin_id
          where b.id = ${id} and b.tenant_id = ${ctx.tenantId}`,
  )
  if (!broadcast) throw notFound("Conversation not found.")
  return {
    id: broadcast.id,
    name:
      broadcast.audience === "event"
        ? broadcast.audience_label
        : `Announcement · ${broadcast.audience_label}`,
    initials: broadcast.audience === "event" ? initialsOf(broadcast.audience_label) : "",
    subtitle: `Sent to ${broadcast.recipients} people`,
    announcement: broadcast.audience !== "event",
    canReply: false,
    messages: [
      {
        id: broadcast.id,
        text: broadcast.body,
        mine: true,
        meta: `${formatStamp(broadcast.created_at, now, ctx.tz)} · ${firstName(broadcast.sender)} · ${broadcast.recipients} delivered`,
      },
    ],
  }
}

export async function reply(
  adminId: string,
  staffId: string,
  text: string,
  now: Date,
): Promise<ThreadMessage> {
  const ctx = await adminCtx(adminId)
  const [person] = await rows<{ id: string }>(
    sql()`select id from staff where id = ${staffId} and tenant_id = ${ctx.tenantId} and active`,
  )
  if (!person) throw notFound("Conversation not found.")
  const clean = text.trim()
  if (!clean) throw badRequest("Write a message first.", "invalid_request")
  await messageStaff(ctx, staffId, clean)
  return {
    id: `sent-${now.getTime()}`,
    text: clean,
    mine: true,
    meta: `${formatTime(now, ctx.tz)} · ${firstName(ctx.name)}`,
  }
}

type Recipient = { id: string; push_enabled: boolean; notify_msg: boolean }

async function recipientsFor(
  ctx: AdminCtx,
  audience: AudienceKey,
  eventId?: string,
): Promise<Recipient[]> {
  if (audience === "all") {
    return rows<Recipient>(
      sql()`select id, push_enabled, notify_msg from staff
            where tenant_id = ${ctx.tenantId} and active and onboarded_at is not null`,
    )
  }
  if (audience === "event") {
    if (!eventId) throw badRequest("Choose which crew to message.", "invalid_request")
    return rows<Recipient>(
      sql()`select s.id, s.push_enabled, s.notify_msg from assignments a
            join staff s on s.id = a.staff_id join events e on e.id = a.event_id
            where a.event_id = ${eventId} and e.tenant_id = ${ctx.tenantId} and s.active`,
    )
  }
  return rows<Recipient>(
    sql()`select distinct s.id, s.push_enabled, s.notify_msg from assignments a
          join staff s on s.id = a.staff_id join events e on e.id = a.event_id
          where e.tenant_id = ${ctx.tenantId} and e.status = 'published' and s.active
            and e.ends_at > now() and e.starts_at < now() + interval '12 hours'`,
  )
}

const reachLine = (people: Recipient[]): string => {
  const off = people.filter((p) => !p.push_enabled).length
  return off === 0
    ? `${people.length} people · all have notifications on`
    : `${people.length} people · ${off} ${off === 1 ? "has" : "have"} notifications off and will see it in their inbox`
}

/** The three audiences with who each would reach (before anything is sent). */
/** The crew an announcement defaults to: the soonest published event that has not ended. */
async function defaultEventId(ctx: AdminCtx): Promise<string | undefined> {
  const [soonest] = await rows<{ id: string }>(
    sql()`select e.id from events e where e.tenant_id = ${ctx.tenantId} and e.status = 'published'
            and e.ends_at > now() order by e.starts_at limit 1`,
  )
  return soonest?.id
}

export async function audiences(adminId: string, eventId: string | undefined): Promise<Audience[]> {
  const ctx = await adminCtx(adminId)
  const event = eventId ?? (await defaultEventId(ctx))
  const [crew, tonight, all] = await Promise.all([
    event ? recipientsFor(ctx, "event", event) : Promise.resolve([]),
    recipientsFor(ctx, "tonight"),
    recipientsFor(ctx, "all"),
  ])
  const [title] = event
    ? await rows<{ title: string }>(sql()`select title from events where id = ${event}`)
    : []
  const crewLabel = title ? `${title.title.split(" · ")[0]} crew · ${crew.length}` : "This crew"
  return [
    { key: "event", label: crewLabel, reach: reachLine(crew) },
    {
      key: "tonight",
      label: `Everyone working tonight · ${tonight.length}`,
      reach: reachLine(tonight),
    },
    { key: "all", label: `All staff · ${all.length}`, reach: reachLine(all) },
  ]
}

export async function announce(
  adminId: string,
  input: { audience: AudienceKey; eventId?: string; text: string },
  now: Date,
): Promise<{ delivered: number }> {
  const ctx = await adminCtx(adminId)
  const eventId =
    input.eventId ?? (input.audience === "event" ? await defaultEventId(ctx) : undefined)
  const people = await recipientsFor(ctx, input.audience, eventId)
  if (people.length === 0) throw conflict("no_recipients", "No one would receive that.")
  const label =
    (await audiences(adminId, eventId)).find((a) => a.key === input.audience)?.label ?? ""
  const heading =
    input.audience === "all"
      ? "Announcement to all staff"
      : input.audience === "tonight"
        ? "Announcement to tonight's crew"
        : label

  const [created] = await rows<{ id: string }>(
    sql()`insert into broadcasts (tenant_id, admin_id, audience, audience_label, event_id, body, recipients, created_at)
          values (${ctx.tenantId}, ${ctx.adminId}, ${input.audience},
                  ${input.audience === "all" ? "All staff" : input.audience === "tonight" ? "Everyone working tonight" : label},
                  ${eventId ?? null}, ${input.text}, ${people.length}, ${now.toISOString()})
          returning id`,
  )
  const payload = JSON.stringify(people.map((p) => p.id))
  await sql()`insert into messages (tenant_id, staff_id, sender, sender_name, body, delivered_at,
                                    broadcast_id, sender_admin_id, admin_read_at, created_at)
              select ${ctx.tenantId}, id::uuid, 'broadcast', ${heading}, ${input.text}, now(),
                     ${created.id}, ${ctx.adminId}, now(), ${now.toISOString()}
              from jsonb_array_elements_text(${payload}::jsonb) as id`
  // A push goes to everyone with notifications on; the rest see it in their inbox.
  await notifyStaff(
    people
      .filter((p) => p.push_enabled && p.notify_msg)
      .map((p) => ({
        staffId: p.id,
        icon: "campaign",
        tone: "info" as const,
        title: `Announcement from ${firstName(ctx.name)}`,
        body: clip(input.text, 60),
        href: "/staff/inbox",
      })),
  )
  return { delivered: people.length }
}
