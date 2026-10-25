import { ClockRequestDto } from "@/lib/data/staff/schemas"
import { ok, readId, staffRoute } from "@/server/http/handler"
import { getRequestStatus } from "@/server/staff/clock"

/** Polled while an out-of-fence clock-in waits for dispatch. */
export const GET = staffRoute<{ id: string }>(async ({ params, staffId }) =>
  ok(ClockRequestDto, await getRequestStatus(staffId, readId(params.id), new Date())),
)
