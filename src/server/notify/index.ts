// Every notification has two halves: a row in the person's notification center, and a push to the
// devices they allowed. Callers say who and what; this decides delivery.
import { rows, sql } from "../db/client"
import { pushTo, type PushMessage } from "./push"

export type Tone = "accent" | "info" | "ok" | "warn"
type Content = { icon: string; tone: Tone; title: string; body: string; href: string }
export type StaffNotice = Content & { staffId: string }
export type AdminNotice = Content & { dedupeKey?: string }

const messageOf = (n: Content): PushMessage => ({ title: n.title, body: n.body, href: n.href })

/** One insert for any number of staff notifications, then one push per distinct message. */
export async function notifyStaff(notices: StaffNotice[]): Promise<void> {
  if (notices.length === 0) return
  const payload = JSON.stringify(
    notices.map((n) => ({
      staff_id: n.staffId,
      icon: n.icon,
      tone: n.tone,
      title: n.title,
      body: n.body,
      href: n.href,
    })),
  )
  await sql()`insert into notifications (staff_id, icon, tone, title, body, href)
              select staff_id, icon, tone, title, body, href
              from jsonb_to_recordset(${payload}::jsonb)
                as x(staff_id uuid, icon text, tone text, title text, body text, href text)`
  await pushToStaff(notices)
}

/** Pushes to the staff who have push on; people with it off still get the row. */
export async function pushToStaff(notices: StaffNotice[]): Promise<void> {
  const allowed = new Set(
    (
      await rows<{ id: string }>(
        sql()`select id from staff
              where id = any(${[...new Set(notices.map((n) => n.staffId))]}::uuid[]) and push_enabled`,
      )
    ).map((row) => row.id),
  )
  const byMessage = new Map<string, { message: PushMessage; ids: string[] }>()
  for (const n of notices) {
    if (!allowed.has(n.staffId)) continue
    const message = messageOf(n)
    const key = JSON.stringify(message)
    const group = byMessage.get(key) ?? { message, ids: [] }
    group.ids.push(n.staffId)
    byMessage.set(key, group)
  }
  await Promise.all([...byMessage.values()].map((g) => pushTo("staff", g.ids, g.message)))
}

/**
 * Tells every dispatcher of a tenant. A `dedupeKey` makes it once-only (for things derived from the
 * clock, like "late"): a repeat is ignored and does not push again.
 */
export async function notifyAdmins(tenantId: string, notice: AdminNotice): Promise<void> {
  const created = await rows<{ admin_id: string }>(
    sql()`insert into admin_notifications (admin_id, dedupe_key, icon, tone, title, body, href)
          select a.id, ${notice.dedupeKey ?? null}, ${notice.icon}, ${notice.tone}, ${notice.title},
                 ${notice.body}, ${notice.href}
          from admins a where a.tenant_id = ${tenantId}
          on conflict (admin_id, dedupe_key) where dedupe_key is not null do nothing
          returning admin_id`,
  )
  await pushTo(
    "admin",
    created.map((row) => row.admin_id),
    messageOf(notice),
  )
}
