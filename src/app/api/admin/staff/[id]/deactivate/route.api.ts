import { deactivateStaff } from "@/server/admin/staff"
import { adminRoute, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) => {
  await deactivateStaff(adminId, readId(params.id), new Date())
  return Response.json({ ok: true })
})
