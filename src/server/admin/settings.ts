// Tenant settings (Settings screen): the accent color staff see, and the clock-in rules.
import type { Settings, SettingsPatch } from "@/lib/data/admin/schemas"

import { rows, sql } from "../db/client"
import { adminCtx } from "./common"

type Row = {
  name: string
  accent: string
  clock_window_min: number
  default_radius_m: number
  min_accuracy_m: number
  selfie_required: boolean
  flag_early_out: boolean
}

export async function getSettings(adminId: string): Promise<Settings> {
  const ctx = await adminCtx(adminId)
  const [row] = await rows<Row>(
    sql()`select name, accent, clock_window_min, default_radius_m, min_accuracy_m,
                 selfie_required, flag_early_out
          from tenants where id = ${ctx.tenantId}`,
  )
  return {
    company: row.name,
    accent: row.accent,
    rules: {
      windowMin: row.clock_window_min,
      radiusM: row.default_radius_m,
      accuracyM: row.min_accuracy_m,
      selfie: row.selfie_required,
      earlyOut: row.flag_early_out,
    },
  }
}

/** Only the fields present change (null keeps the stored value). */
export async function patchSettings(adminId: string, patch: SettingsPatch): Promise<Settings> {
  const ctx = await adminCtx(adminId)
  const r = patch.rules
  await sql()`update tenants set
      accent = coalesce(${patch.accent ?? null}::text, accent),
      clock_window_min = coalesce(${r?.windowMin ?? null}::int, clock_window_min),
      default_radius_m = coalesce(${r?.radiusM ?? null}::int, default_radius_m),
      min_accuracy_m = coalesce(${r?.accuracyM ?? null}::int, min_accuracy_m),
      selfie_required = coalesce(${r?.selfie ?? null}::boolean, selfie_required),
      flag_early_out = coalesce(${r?.earlyOut ?? null}::boolean, flag_early_out)
    where id = ${ctx.tenantId}`
  return getSettings(adminId)
}
