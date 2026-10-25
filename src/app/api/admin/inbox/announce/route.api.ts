import { AnnounceRequest, AnnounceResultDto } from "@/lib/data/admin/ops-schemas"
import { announce } from "@/server/admin/inbox"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute(async ({ req, adminId }) => {
  const input = await readBody(req, AnnounceRequest)
  const eventId = input.eventId ? readId(input.eventId) : undefined
  return ok(AnnounceResultDto, await announce(adminId, { ...input, eventId }, new Date()), 201)
})
