import { z } from "zod/mini"

import { InvoiceRowDto } from "@/lib/data/admin/ops-schemas"
import { listInvoices } from "@/server/admin/invoices"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(z.array(InvoiceRowDto), await listInvoices(adminId, new Date())),
)
