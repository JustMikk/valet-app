import { z } from "zod/mini"

import { SessionDto } from "@/lib/data/staff/schemas"
import { demoSession } from "@/server/auth/sign-in"
import { ok, readOptionalBody, route } from "@/server/http/handler"

const DemoRequest = z.object({ role: z.optional(z.enum(["staff", "admin"])) })

/** One-tap session for the demo worker or dispatcher; 404 unless DEMO_MODE=1. */
export const POST = route(async ({ req }) => {
  // The staff app posts with no body; only the admin app names a role.
  const body = await readOptionalBody(req, DemoRequest)
  return ok(SessionDto, await demoSession(body.role ?? "staff"))
})
