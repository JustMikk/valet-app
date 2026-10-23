import { z } from "zod/mini"

import { VenueRowDto } from "@/lib/data/admin/schemas"
import { listVenues } from "@/server/admin/venues"
import { adminRoute, ok } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(z.array(VenueRowDto), await listVenues(adminId, new Date())),
)
