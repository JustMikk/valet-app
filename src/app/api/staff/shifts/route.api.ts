import { z } from "zod/mini"

import { ShiftCardDto, ShiftTab } from "@/lib/data/staff/schemas"
import { ok, readQuery, staffRoute } from "@/server/http/handler"
import { listShifts } from "@/server/staff/shifts"

export const GET = staffRoute(async ({ req, staffId }) => {
  const tab = readQuery(req, "tab", z.optional(ShiftTab)) ?? "upcoming"
  return ok(z.array(ShiftCardDto), await listShifts(staffId, tab, new Date()))
})
