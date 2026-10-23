import { NotificationsDto } from "@/lib/data/staff/schemas"
import { getAdminNotifications } from "@/server/admin/notifications"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(NotificationsDto, await getAdminNotifications(adminId, new Date())),
)
