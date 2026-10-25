import { RemoveResultDto } from "@/lib/data/admin/ops-schemas"
import { removeFromSlot } from "@/server/admin/live"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(RemoveResultDto, await removeFromSlot(adminId, readId(params.id), new Date())),
)
