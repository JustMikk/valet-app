import { AvailabilityQuery, AvailableStaffDto } from "@/lib/data/admin/schemas"
import { availableForWindow } from "@/server/admin/events"
import { adminRoute, badRequest, ok } from "@/server/http/handler"

/** Free staff for a venue and time, for an event that is not created yet. */
export const GET = adminRoute(async ({ req, adminId }) => {
  const parsed = AvailabilityQuery.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) throw badRequest("Choose a venue, date and times first.", "invalid_request")
  return ok(AvailableStaffDto, await availableForWindow(adminId, parsed.data, new Date()))
})
