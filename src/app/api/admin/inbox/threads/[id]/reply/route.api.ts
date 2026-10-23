import { ReplyRequest, ThreadMessageDto } from "@/lib/data/admin/ops-schemas"
import { reply } from "@/server/admin/inbox"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const { text } = await readBody(req, ReplyRequest)
  return ok(ThreadMessageDto, await reply(adminId, readId(params.id), text, new Date()), 201)
})
