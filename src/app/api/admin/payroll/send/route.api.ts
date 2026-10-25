import { SendPayrollResultDto } from "@/lib/data/admin/ops-schemas"
import { sendPayroll } from "@/server/admin/invoices"
import { adminRoute, ok } from "@/server/http/handler"

export const POST = adminRoute(async ({ adminId }) =>
  ok(SendPayrollResultDto, await sendPayroll(adminId, new Date())),
)
