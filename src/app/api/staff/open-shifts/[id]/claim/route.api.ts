import { ClaimResultDto } from "@/lib/data/staff/schemas"
import { ok, readId, staffRoute } from "@/server/http/handler"
import { claimShift } from "@/server/staff/open-shifts"

export const POST = staffRoute<{ id: string }>(async ({ params, staffId }) =>
  ok(ClaimResultDto, await claimShift(staffId, readId(params.id), new Date())),
)
