import { env } from "@/server/env"
import { ApiError, route } from "@/server/http/handler"
import { sendDueReminders } from "@/server/reminders"

/**
 * Shift reminders (ADR-026), called every 5 minutes by an outside cron service with
 * `Authorization: Bearer <CRON_SECRET>`. Off when no secret is set.
 */
export const GET = route(async ({ req }) => {
  const secret = env().CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new ApiError(401, "unauthorized", "Not allowed.")
  }
  return Response.json({ sent: await sendDueReminders() })
})
