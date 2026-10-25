import { PayrollDto } from "@/lib/data/admin/ops-schemas"
import { getPayroll } from "@/server/admin/invoices"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(PayrollDto, await getPayroll(adminId, new Date())),
)
