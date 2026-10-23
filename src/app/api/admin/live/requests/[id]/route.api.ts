import { DecideRequest, DecideResultDto } from "@/lib/data/admin/ops-schemas"
import { decideRequest } from "@/server/admin/live"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const { decision } = await readBody(req, DecideRequest)
  return ok(DecideResultDto, await decideRequest(adminId, readId(params.id), decision, new Date()))
})
