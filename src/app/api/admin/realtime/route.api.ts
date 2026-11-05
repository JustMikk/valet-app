import {
  RealtimeAuthDto,
  RealtimeAuthRequest,
  RealtimeConfigDto,
} from "@/lib/data/realtime-schemas"
import { ok, readBody, adminRoute } from "@/server/http/handler"
import { realtimeAuth, realtimeConfig } from "@/server/realtime/access"

/** Where this person's app listens (null: realtime is off). */
export const GET = adminRoute(async ({ adminId }) =>
  ok(RealtimeConfigDto, await realtimeConfig({ role: "admin", id: adminId })),
)

/** Signs this admin's subscription to their tenant's admins channel. */
export const POST = adminRoute(async ({ req, adminId }) =>
  ok(
    RealtimeAuthDto,
    await realtimeAuth({ role: "admin", id: adminId }, await readBody(req, RealtimeAuthRequest)),
  ),
)
