import { HomeDto } from "@/lib/data/staff/schemas"
import { ok, staffRoute } from "@/server/http/handler"
import { getHome } from "@/server/staff/home"

export const GET = staffRoute(async ({ staffId }) =>
  ok(HomeDto, await getHome(staffId, new Date())),
)
