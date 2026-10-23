import { DropRequest, DropResultDto } from "@/lib/data/staff/schemas"
import { ok, readBody, readId, staffRoute } from "@/server/http/handler"
import { dropShift } from "@/server/staff/shifts"

export const POST = staffRoute<{ id: string }>(async ({ req, params, staffId }) =>
  ok(
    DropResultDto,
    await dropShift(staffId, readId(params.id), await readBody(req, DropRequest), new Date()),
  ),
)
