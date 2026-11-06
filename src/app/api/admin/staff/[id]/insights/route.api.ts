import { z } from "zod/mini"

import { PersonInsightsDto, type InsightRange } from "@/lib/data/admin/schemas"
import { getPersonInsights } from "@/server/admin/person-insights"
import { adminRoute, ok, readId, readQuery } from "@/server/http/handler"

/** `?days=30|90|365` (default 90). */
export const GET = adminRoute<{ id: string }>(async ({ req, params, adminId }) => {
  const days = Number(readQuery(req, "days", z.optional(z.enum(["30", "90", "365"]))) ?? "90")
  return ok(
    PersonInsightsDto,
    await getPersonInsights(adminId, readId(params.id), days as InsightRange, new Date()),
  )
})
