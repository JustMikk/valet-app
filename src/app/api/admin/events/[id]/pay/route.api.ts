import { EventPayDto, PayRatePatch } from "@/lib/data/admin/ops-schemas"
import { getEventPay, setEventPayRate } from "@/server/admin/event-pay"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(EventPayDto, await getEventPay(adminId, readId(params.id))),
)

export const PATCH = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const { rateCents } = await readBody(req, PayRatePatch)
  return ok(EventPayDto, await setEventPayRate(adminId, readId(params.id), rateCents))
})
