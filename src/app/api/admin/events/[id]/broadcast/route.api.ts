import { BroadcastResultDto } from "@/lib/data/admin/ops-schemas"
import { broadcastOpen } from "@/server/admin/events"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(BroadcastResultDto, await broadcastOpen(adminId, readId(params.id))),
)
