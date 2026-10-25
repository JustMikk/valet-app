import { StaffListDto } from "@/lib/data/admin/schemas"
import { listStaff } from "@/server/admin/staff"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(StaffListDto, await listStaff(adminId, new Date())),
)
