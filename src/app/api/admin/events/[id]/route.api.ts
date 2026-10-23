import { EventDetailDto } from "@/lib/data/admin/schemas"
import { getEvent } from "@/server/admin/events"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(EventDetailDto, await getEvent(adminId, readId(params.id), new Date())),
)
