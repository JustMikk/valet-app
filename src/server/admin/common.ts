// Shared by the admin services: who is asking, and the two ways dispatch reaches staff
// (a notification, or a message in their inbox thread).
import { rows, sql } from "../db/client"
import { unauthorized } from "../http/handler"

export type AdminCtx = { adminId: string; tenantId: string; name: string; tz: string }

export async function adminCtx(adminId: string): Promise<AdminCtx> {
  const [row] = await rows<{ tenant_id: string; name: string; timezone: string }>(
    sql()`select a.tenant_id, a.name, t.timezone
          from admins a join tenants t on t.id = a.tenant_id where a.id = ${adminId}`,
  )
  // A token for an admin that no longer exists (a reset can remove one) is simply signed out.
  if (!row) throw unauthorized()
  return { adminId, tenantId: row.tenant_id, name: row.name, tz: row.timezone }
}

export const firstName = (name: string) => name.split(" ")[0] ?? name

/** "Cole Bennett" → "Cole B." */
export function shortName(name: string): string {
  const [first, ...rest] = name.split(" ")
  const last = rest.at(-1)
  return last ? `${first} ${last[0]}.` : (first ?? name)
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => word && word.toLowerCase() !== "the")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")

type Notice = {
  staffId: string
  icon: string
  tone: "accent" | "info" | "ok" | "warn"
  title: string
  body: string
  href: string
}

/** One insert for any number of notifications. */
export async function notifyStaff(notices: Notice[]): Promise<void> {
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
}

/** A message from dispatch into one staff member's thread, plus the "new message" notification. */
export async function messageStaff(
  ctx: AdminCtx,
  staffId: string,
  text: string,
  options: { refLabel?: string } = {},
): Promise<void> {
  await sql()`insert into messages
                (tenant_id, staff_id, sender, sender_name, body, ref_label, delivered_at, sender_admin_id, admin_read_at)
              values (${ctx.tenantId}, ${staffId}, 'dispatch', ${`${firstName(ctx.name)} · Dispatch`},
                      ${text}, ${options.refLabel ?? null}, now(), ${ctx.adminId}, now())`
  const [prefs] = await rows<{ notify_msg: boolean }>(
    sql()`select notify_msg from staff where id = ${staffId}`,
  )
  if (prefs?.notify_msg) {
    await notifyStaff([
      {
        staffId,
        icon: "chat_bubble",
        tone: "info",
        title: `New message from ${firstName(ctx.name)}`,
        body: text.length > 60 ? `${text.slice(0, 57)}…` : text,
        href: "/staff/inbox",
      },
    ])
  }
}
