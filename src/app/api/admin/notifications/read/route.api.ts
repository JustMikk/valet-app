import { markAdminRead } from "@/server/admin/notifications"
import { adminRoute } from "@/server/http/handler"

export const POST = adminRoute(async ({ adminId }) => {
  await markAdminRead(adminId)
  return Response.json({ ok: true })
})
