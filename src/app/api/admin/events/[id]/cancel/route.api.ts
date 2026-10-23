import { cancelEvent } from "@/server/admin/events"
import { adminRoute, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) => {
  await cancelEvent(adminId, readId(params.id))
  return Response.json({ ok: true })
})
