import { approveEntry } from "@/server/admin/hours"
import { adminRoute, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) => {
  await approveEntry(adminId, readId(params.id))
  return Response.json({ ok: true })
})
