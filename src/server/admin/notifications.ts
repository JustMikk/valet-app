// The dispatcher's notification center (the bell on every admin page): late people, clock-in
// requests, dropped shifts and staff messages, newest first, with the unread count.
import type { Notifications } from "@/lib/data/staff/schemas"

import { rows, sql } from "../db/client"
import { buildCenter, type NoticeRow } from "../notify/center"
import { adminCtx } from "./common"

export async function getAdminNotifications(adminId: string, now: Date): Promise<Notifications> {
  const ctx = await adminCtx(adminId)
  const list = await rows<NoticeRow>(
    sql()`select id, icon, tone, title, body, href, created_at, read_at
          from admin_notifications where admin_id = ${adminId}
          order by created_at desc limit 50`,
  )
  return buildCenter(list, ctx.tz, now)
}

export async function markAdminRead(adminId: string): Promise<void> {
  await sql()`update admin_notifications set read_at = now()
              where admin_id = ${adminId} and read_at is null`
}
