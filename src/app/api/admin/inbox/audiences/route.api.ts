import { z } from "zod/mini"

import { AudienceDto } from "@/lib/data/admin/ops-schemas"
import { audiences } from "@/server/admin/inbox"
import { adminRoute, ok, readId } from "@/server/http/handler"

/** `?eventId=` names the crew for the "this crew" audience; without it, the soonest event. */
export const GET = adminRoute(async ({ req, adminId }) => {
  const raw = new URL(req.url).searchParams.get("eventId")
  return ok(z.array(AudienceDto), await audiences(adminId, raw ? readId(raw) : undefined))
})
