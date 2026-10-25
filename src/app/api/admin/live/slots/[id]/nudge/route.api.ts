import { NudgeResultDto } from "@/lib/data/admin/ops-schemas"
import { nudge } from "@/server/admin/live"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(NudgeResultDto, await nudge(adminId, readId(params.id))),
)
