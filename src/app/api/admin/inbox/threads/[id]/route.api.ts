import { ThreadDetailDto } from "@/lib/data/admin/ops-schemas"
import { getThread } from "@/server/admin/inbox"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(ThreadDetailDto, await getThread(adminId, readId(params.id), new Date())),
)
