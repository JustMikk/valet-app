import { ProfilePatch, StaffProfileDto } from "@/lib/data/staff/schemas"
import { ok, readBody, staffRoute } from "@/server/http/handler"
import { getProfile, patchProfile } from "@/server/staff/profile"

export const GET = staffRoute(async ({ staffId }) => ok(StaffProfileDto, await getProfile(staffId)))

export const PATCH = staffRoute(async ({ req, staffId }) =>
  ok(StaffProfileDto, await patchProfile(staffId, await readBody(req, ProfilePatch))),
)
