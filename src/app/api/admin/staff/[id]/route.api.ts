import { PersonDto } from "@/lib/data/admin/schemas"
import { getPerson } from "@/server/admin/staff"
import { adminRoute, ok, readId } from "@/server/http/handler"

export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(PersonDto, await getPerson(adminId, readId(params.id), new Date())),
)
