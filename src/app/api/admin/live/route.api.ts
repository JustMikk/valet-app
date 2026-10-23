import { LiveDto } from "@/lib/data/admin/ops-schemas"
import { getLive } from "@/server/admin/live"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(LiveDto, await getLive(adminId, new Date())),
)
