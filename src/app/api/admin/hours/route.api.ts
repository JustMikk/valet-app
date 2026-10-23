import { HoursDto } from "@/lib/data/admin/ops-schemas"
import { getHours } from "@/server/admin/hours"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(HoursDto, await getHours(adminId, new Date())),
)
