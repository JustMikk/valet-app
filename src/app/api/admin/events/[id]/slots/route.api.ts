import { AddSlotResultDto } from "@/lib/data/admin/ops-schemas"
import { addSlot } from "@/server/admin/events"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const POST = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(AddSlotResultDto, await addSlot(adminId, readId(params.id)), 201),
)
