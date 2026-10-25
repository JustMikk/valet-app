import { SettingsDto, SettingsPatch } from "@/lib/data/admin/schemas"
import { getSettings, patchSettings } from "@/server/admin/settings"
import { adminRoute, ok, readBody } from "@/server/http/handler"

export const GET = adminRoute(async ({ adminId }) => ok(SettingsDto, await getSettings(adminId)))

export const PATCH = adminRoute(async ({ req, adminId }) =>
  ok(SettingsDto, await patchSettings(adminId, await readBody(req, SettingsPatch))),
)
