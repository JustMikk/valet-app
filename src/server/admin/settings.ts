// Tenant settings (Settings screen): the accent color staff see, the clock-in rules, the pay
// and billing defaults (ADR-022), and the signed-in admin's own sign-in phone (ADR-025).
import { formatPhone, phoneKey } from "@/lib/contact/contact"
import type { Settings, SettingsPatch } from "@/lib/data/admin/schemas"

import { rows, sql } from "../db/client"
import { badRequest, conflict } from "../http/handler"
import { adminCtx } from "./common"

type Row = {
  name: string
  accent: string
  clock_window_min: number
  default_radius_m: number
  min_accuracy_m: number
  selfie_required: boolean
  flag_early_out: boolean
  pay_rate_cents: number
  sales_tax_bp: number
  my_phone: string
}

export async function getSettings(adminId: string): Promise<Settings> {
  const ctx = await adminCtx(adminId)
  const [row] = await rows<Row>(
    sql()`select t.name, t.accent, t.clock_window_min, t.default_radius_m, t.min_accuracy_m,
                 t.selfie_required, t.flag_early_out, t.pay_rate_cents, t.sales_tax_bp,
                 a.phone as my_phone
          from tenants t join admins a on a.tenant_id = t.id
          where t.id = ${ctx.tenantId} and a.id = ${adminId}`,
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
    billing: { payRateCents: row.pay_rate_cents, salesTaxBp: row.sales_tax_bp },
    myPhone: row.my_phone,
  }
}

/** The admin's own sign-in phone: "" clears it; a number already used by an admin is refused. */
async function setMyPhone(adminId: string, text: string): Promise<void> {
  if (text !== "" && !phoneKey(text)) {
    throw badRequest("Enter a full phone number, like (713) 555-0120.", "invalid_phone")
  }
  const phone = text === "" ? "" : formatPhone(text)
  const [taken] = await rows<{ id: string }>(
    sql()`select id from admins where phone_key = ${phoneKey(phone)} and id <> ${adminId}`,
  )
  if (taken) throw conflict("phone_taken", "Another admin already signs in with that number.")
  await sql()`update admins set phone = ${phone} where id = ${adminId}`
}

/** Only the fields present change (null keeps the stored value). */
export async function patchSettings(adminId: string, patch: SettingsPatch): Promise<Settings> {
  const ctx = await adminCtx(adminId)
  if (patch.myPhone !== undefined) await setMyPhone(adminId, patch.myPhone)
  const r = patch.rules
  const b = patch.billing
  await sql()`update tenants set
      accent = coalesce(${patch.accent ?? null}::text, accent),
      clock_window_min = coalesce(${r?.windowMin ?? null}::int, clock_window_min),
      default_radius_m = coalesce(${r?.radiusM ?? null}::int, default_radius_m),
      min_accuracy_m = coalesce(${r?.accuracyM ?? null}::int, min_accuracy_m),
      selfie_required = coalesce(${r?.selfie ?? null}::boolean, selfie_required),
      flag_early_out = coalesce(${r?.earlyOut ?? null}::boolean, flag_early_out),
      pay_rate_cents = coalesce(${b?.payRateCents ?? null}::int, pay_rate_cents),
      sales_tax_bp = coalesce(${b?.salesTaxBp ?? null}::int, sales_tax_bp)
    where id = ${ctx.tenantId}`
  return getSettings(adminId)
}
