import { z } from "zod/mini"

import { SendPayrollResultDto } from "@/lib/data/admin/ops-schemas"
import { sendPayrollTo } from "@/server/admin/invoices"
import { adminRoute, ok, readBody } from "@/server/http/handler"

const Body = z.object({ staffId: z.string() })

export const POST = adminRoute(async ({ req, adminId }) => {
  const { staffId } = await readBody(req, Body)
  return ok(SendPayrollResultDto, await sendPayrollTo(adminId, staffId, new Date()))
})
