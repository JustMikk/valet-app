import { AdminSessionDto } from "@/lib/data/admin/schemas"
import { getAdminSession } from "@/server/admin/session"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(AdminSessionDto, await getAdminSession(adminId, new Date())),
)
