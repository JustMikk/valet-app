import { SendInvoiceResultDto } from "@/lib/data/admin/ops-schemas"
import { sendInvoice } from "@/server/admin/invoices"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(SendInvoiceResultDto, await sendInvoice(adminId, readId(params.id), new Date())),
)
