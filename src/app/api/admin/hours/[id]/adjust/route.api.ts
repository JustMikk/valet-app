import { AdjustRequest, AdjustResultDto } from "@/lib/data/admin/ops-schemas"
import { adjustEntry } from "@/server/admin/hours"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) =>
  ok(
    AdjustResultDto,
    await adjustEntry(adminId, readId(params.id), await readBody(req, AdjustRequest)),
  ),
)
