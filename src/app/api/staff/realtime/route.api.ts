import {
  RealtimeAuthDto,
  RealtimeAuthRequest,
  RealtimeConfigDto,
} from "@/lib/data/realtime-schemas"
import { ok, readBody, staffRoute } from "@/server/http/handler"
import { realtimeAuth, realtimeConfig } from "@/server/realtime/access"

/** Where this person's app listens (null: realtime is off). */
export const GET = staffRoute(async ({ staffId }) =>
  ok(RealtimeConfigDto, await realtimeConfig({ role: "staff", id: staffId })),
)

/** Signs this person's subscription to their own private channel. */
export const POST = staffRoute(async ({ req, staffId }) =>
  ok(
    RealtimeAuthDto,
    await realtimeAuth({ role: "staff", id: staffId }, await readBody(req, RealtimeAuthRequest)),
  ),
)
