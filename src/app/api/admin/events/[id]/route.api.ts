import { EventDetailDto, EventPatch } from "@/lib/data/admin/schemas"
import { getEvent, updateEvent } from "@/server/admin/events"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(EventDetailDto, await getEvent(adminId, readId(params.id), new Date())),
)

export const PATCH = adminRoute<{ id: string }>(async ({ req, params, adminId }) =>
  ok(
    EventDetailDto,
    await updateEvent(adminId, readId(params.id), await readBody(req, EventPatch), new Date()),
  ),
)
