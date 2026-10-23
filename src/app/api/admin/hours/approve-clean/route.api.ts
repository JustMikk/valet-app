import { ApproveCleanResultDto } from "@/lib/data/admin/ops-schemas"
import { approveClean } from "@/server/admin/hours"
import { adminRoute, ok } from "@/server/http/handler"

export const POST = adminRoute(async ({ adminId }) =>
  ok(ApproveCleanResultDto, { approved: await approveClean(adminId) }),
)
