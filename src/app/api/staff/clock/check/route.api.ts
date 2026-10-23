import { ClockCheckDto, ClockCheckRequest } from "@/lib/data/staff/schemas"
import { ok, readBody, staffRoute } from "@/server/http/handler"
import { checkLocation } from "@/server/staff/clock"

export const POST = staffRoute(async ({ req, staffId }) =>
  ok(ClockCheckDto, await checkLocation(staffId, await readBody(req, ClockCheckRequest))),
)
