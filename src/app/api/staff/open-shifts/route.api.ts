import { z } from "zod/mini"

import { OpenShiftDto } from "@/lib/data/staff/schemas"
import { ok, staffRoute } from "@/server/http/handler"
import { listOpenShifts } from "@/server/staff/open-shifts"

export const GET = staffRoute(async ({ staffId }) =>
  ok(z.array(OpenShiftDto), await listOpenShifts(staffId, new Date())),
)
