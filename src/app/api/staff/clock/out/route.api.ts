import { ClockPunchDto, ClockPunchRequest } from "@/lib/data/staff/schemas"
import { ok, readBody, staffRoute } from "@/server/http/handler"
import { punchOut } from "@/server/staff/clock"

export const POST = staffRoute(async ({ req, staffId }) =>
  ok(ClockPunchDto, await punchOut(staffId, await readBody(req, ClockPunchRequest), new Date())),
)
