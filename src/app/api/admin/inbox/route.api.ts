import { InboxDto } from "@/lib/data/admin/ops-schemas"
import { getInbox } from "@/server/admin/inbox"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(InboxDto, await getInbox(adminId, new Date())),
)
