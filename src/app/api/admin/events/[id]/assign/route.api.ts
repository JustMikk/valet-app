import { AssignRequest, AssignResultDto } from "@/lib/data/admin/schemas"
import { assign } from "@/server/admin/events"
import { adminRoute, ok, readId, readOptionalBody } from "@/server/http/handler"

/** Names the people, or leaves it to the server to pick the best-suited free person. */
export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const body = await readOptionalBody(req, AssignRequest)
  return ok(AssignResultDto, await assign(adminId, readId(params.id), body.staffIds, new Date()))
})
