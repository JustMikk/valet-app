import { EventPayDto } from "@/lib/data/admin/ops-schemas"
import { markAllEventPaid } from "@/server/admin/event-pay"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(EventPayDto, await markAllEventPaid(adminId, readId(params.id))),
)
