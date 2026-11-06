import { z } from "zod/mini"

import { PayrollEventRowDto } from "@/lib/data/admin/ops-schemas"
import { listPayrollEvents } from "@/server/admin/event-pay"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(z.array(PayrollEventRowDto), await listPayrollEvents(adminId)),
)
