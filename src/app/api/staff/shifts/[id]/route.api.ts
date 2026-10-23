import { ShiftDetailDto } from "@/lib/data/staff/schemas"
import { ok, readId, staffRoute } from "@/server/http/handler"
import { getShift } from "@/server/staff/shifts"

/** `next` stands for "my next shift" when a screen is opened without an id. */
export const GET = staffRoute<{ id: string }>(async ({ params, staffId }) =>
  ok(
    ShiftDetailDto,
    await getShift(staffId, params.id === "next" ? undefined : readId(params.id), new Date()),
  ),
)
