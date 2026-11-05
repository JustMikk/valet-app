import { recordAllPulses } from "@/server/admin/live"
import { env } from "@/server/env"
import { ApiError, route } from "@/server/http/handler"

/** Scheduled Live Board snapshot (ADR-021), every 5 min: `Authorization: Bearer <CRON_SECRET>`. */
export const GET = route(async ({ req }) => {
  const secret = env().CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new ApiError(401, "unauthorized", "Not allowed.")
  }
  return Response.json({ tenants: await recordAllPulses(new Date()) })
})
