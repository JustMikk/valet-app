import { z } from "zod/mini"

import { TeamPerformanceRowDto, type InsightRange } from "@/lib/data/admin/schemas"
import { listTeamPerformance } from "@/server/admin/team-performance"
import { adminRoute, ok, readQuery } from "@/server/http/handler"

/** `?days=30|90|365` (default 90). */
export const GET = adminRoute(async ({ req, adminId }) => {
  const days = Number(readQuery(req, "days", z.optional(z.enum(["30", "90", "365"]))) ?? "90")
  return ok(
    z.array(TeamPerformanceRowDto),
    await listTeamPerformance(adminId, days as InsightRange, new Date()),
  )
})
