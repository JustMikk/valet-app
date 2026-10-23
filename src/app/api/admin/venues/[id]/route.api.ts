import { VenueDetailDto, VenuePatch } from "@/lib/data/admin/schemas"
import { getVenue, patchVenue } from "@/server/admin/venues"
import { adminRoute, ok, readBody, readId } from "@/server/http/handler"

/** `first` stands for "the first venue" when a screen is opened without an id. */
export const GET = adminRoute<{ id: string }>(async ({ params, adminId }) =>
  ok(
    VenueDetailDto,
    await getVenue(adminId, params.id === "first" ? undefined : readId(params.id), new Date()),
  ),
)

export const PATCH = adminRoute<{ id: string }>(async ({ req, params, adminId }) =>
  ok(
    VenueDetailDto,
    await patchVenue(adminId, readId(params.id), await readBody(req, VenuePatch), new Date()),
  ),
)
