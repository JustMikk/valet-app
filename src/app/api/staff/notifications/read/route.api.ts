import { staffRoute } from "@/server/http/handler"
import { markAllRead } from "@/server/staff/notifications"

export const POST = staffRoute(async ({ staffId }) => {
  await markAllRead(staffId)
  return Response.json({ ok: true })
})
