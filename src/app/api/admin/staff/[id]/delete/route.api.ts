import { deleteStaff } from "@/server/admin/staff"
import { adminRoute, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) => {
  await deleteStaff(adminId, readId(params.id))
  return Response.json({ ok: true })
})
