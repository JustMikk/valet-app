import { publishEvent } from "@/server/admin/events"
import { adminRoute, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) => {
  await publishEvent(adminId, readId(params.id), new Date())
  return Response.json({ ok: true })
})
