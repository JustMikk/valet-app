import { z } from "zod/mini"

import { NewVenueRequest, VenueDetailDto, VenueRowDto } from "@/lib/data/admin/schemas"
import { createVenue, listVenues } from "@/server/admin/venues"
import { adminRoute, ok, readBody } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) =>
  ok(z.array(VenueRowDto), await listVenues(adminId, new Date())),
)

export const POST = adminRoute(async ({ req, adminId }) =>
  ok(
    VenueDetailDto,
    await createVenue(adminId, await readBody(req, NewVenueRequest), new Date()),
    201,
  ),
)
