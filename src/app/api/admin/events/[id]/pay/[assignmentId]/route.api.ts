import { EventPayDto, PayMarkPatch } from "@/lib/data/admin/ops-schemas"
import { markEventPay } from "@/server/admin/event-pay"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const PATCH = adminRoute<{ id: string; assignmentId: string }>(
  async ({ req, params, adminId }) =>
    ok(
      EventPayDto,
      await markEventPay(
        adminId,
        readId(params.id),
        readId(params.assignmentId),
        await readBody(req, PayMarkPatch),
      ),
    ),
)
