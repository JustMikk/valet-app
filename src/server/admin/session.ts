// What the admin shell needs on every screen: who is signed in, the brand color, and the counts
// that tell a dispatcher where to look (Live Board, Hours, Inbox).
import type { AdminSession } from "@/lib/data/admin/schemas"

import { rows, sql } from "../db/client"
import { adminCtx, initialsOf } from "./common"
import { reviewCount } from "./hours"
import { unreadCount } from "./inbox"
import { attentionCount } from "./live"

export async function getAdminSession(adminId: string, now: Date): Promise<AdminSession> {
  const ctx = await adminCtx(adminId)
  const [[admin], live, hours, inbox] = await Promise.all([
    rows<{ name: string; role_label: string; company: string; accent: string }>(
      sql()`select a.name, a.role_label, t.name as company, t.accent
            from admins a join tenants t on t.id = a.tenant_id where a.id = ${adminId}`,
    ),
    attentionCount(ctx.tenantId, now),
    reviewCount(ctx.tenantId),
    unreadCount(ctx.tenantId),
  ])
  return {
    admin: {
      initials: initialsOf(admin.name),
      name: admin.name,
      role: admin.role_label,
      company: admin.company,
    },
    badges: { live, hours, inbox },
    accent: admin.accent,
  }
}
