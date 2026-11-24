import { SendInvoiceRequest, SendInvoiceResultDto } from "@/lib/data/admin/ops-schemas"
import { sendInvoice } from "@/server/admin/invoice-email"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ req, params, adminId }) =>
  ok(
    SendInvoiceResultDto,
    await sendInvoice(
      adminId,
      readId(params.id),
      await readBody(req, SendInvoiceRequest),
      new Date(),
    ),
  ),
)
