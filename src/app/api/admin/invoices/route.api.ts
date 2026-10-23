import { z } from "zod/mini"

import { IdDto } from "@/lib/data/admin/schemas"
import { InvoiceRowDto, NewInvoiceRequest } from "@/lib/data/admin/ops-schemas"
import { createInvoice, listInvoices } from "@/server/admin/invoices"
import { adminRoute, ok, readBody } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(z.array(InvoiceRowDto), await listInvoices(adminId, new Date())),
)

export const POST = adminRoute(async ({ req, adminId }) =>
  ok(IdDto, await createInvoice(adminId, await readBody(req, NewInvoiceRequest), new Date()), 201),
)
