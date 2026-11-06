import { SendEventPayRequest, SendPayrollResultDto } from "@/lib/data/admin/ops-schemas"
import { sendEventPay } from "@/server/admin/event-pay"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const { staffId } = await readBody(req, SendEventPayRequest)
  return ok(
    SendPayrollResultDto,
    await sendEventPay(
      adminId,
      readId(params.id),
      staffId === undefined ? undefined : readId(staffId),
    ),
  )
})
