import { AvailableStaffDto } from "@/lib/data/admin/schemas"
import { availableStaff } from "@/server/admin/events"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(AvailableStaffDto, await availableStaff(adminId, readId(params.id), new Date())),
)
