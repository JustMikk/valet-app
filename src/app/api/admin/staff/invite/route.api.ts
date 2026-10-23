import { InviteRequest, InviteResultDto } from "@/lib/data/admin/schemas"
import { inviteStaff } from "@/server/admin/staff"
import { adminRoute, ok, readBody } from "@/server/http/handler"

export const POST = adminRoute(async ({ req, adminId }) => {
  const { emails } = await readBody(req, InviteRequest)
  return ok(InviteResultDto, await inviteStaff(adminId, emails), 201)
})
