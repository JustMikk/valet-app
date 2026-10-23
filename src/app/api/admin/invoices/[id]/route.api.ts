import { InvoiceDetailDto } from "@/lib/data/admin/ops-schemas"
import { getInvoice } from "@/server/admin/invoices"
import { adminRoute, ok, readId } from "@/server/http/handler"

/** `first` stands for "the first draft" when a screen is opened without an id. */
export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(
    InvoiceDetailDto,
    await getInvoice(adminId, params.id === "first" ? undefined : readId(params.id), new Date()),
  ),
)
