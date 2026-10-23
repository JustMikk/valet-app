import { SessionDto } from "@/lib/data/staff/schemas"
import { demoSession } from "@/server/auth/sign-in"
import { ok, route } from "@/server/http/handler"

/** One-tap session for the demo worker; 404 unless DEMO_MODE=1. */
export const POST = route(async () => ok(SessionDto, await demoSession()))
