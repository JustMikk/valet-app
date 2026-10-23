import { NotificationsDto } from "@/lib/data/staff/schemas"
import { ok, staffRoute } from "@/server/http/handler"
import { getNotifications } from "@/server/staff/notifications"

export const GET = staffRoute(async ({ staffId }) =>
  ok(NotificationsDto, await getNotifications(staffId, new Date())),
)
