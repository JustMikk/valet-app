import type { ProfilePatch, StaffProfile } from "@/lib/data/staff/schemas"

import { rows, sql } from "../db/client"
import { notFound } from "../http/handler"

type ProfileRow = {
  id: string
  name: string
  email: string
  phone: string
  role_label: string
  company: string
  push_enabled: boolean
  location_enabled: boolean
  camera_enabled: boolean
  installed: boolean
  notify_open: boolean
  notify_remind: boolean
  notify_msg: boolean
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function toProfile(row: ProfileRow): StaffProfile {
  return {
    id: row.id,
    initials: initialsOf(row.name),
    name: row.name,
    role: row.role_label,
    email: row.email,
    company: row.company,
    phone: row.phone,
    preferences: { open: row.notify_open, remind: row.notify_remind, msg: row.notify_msg },
    permissions: {
      push: row.push_enabled,
      location: row.location_enabled,
      camera: row.camera_enabled,
      installed: row.installed,
    },
  }
}

export async function getProfile(staffId: string): Promise<StaffProfile> {
  const [row] = await rows<ProfileRow>(
    sql()`select s.id, s.name, s.email, s.phone, s.role_label, t.name as company,
            s.push_enabled, s.location_enabled, s.camera_enabled, s.installed,
            s.notify_open, s.notify_remind, s.notify_msg
          from staff s join tenants t on t.id = s.tenant_id
          where s.id = ${staffId} and s.active`,
  )
  if (!row) throw notFound("Account not found.")
  return toProfile(row)
}

/** Applies only the fields present in the patch (null keeps the stored value). */
export async function patchProfile(staffId: string, patch: ProfilePatch): Promise<StaffProfile> {
  const p = patch.preferences
  const d = patch.permissions
  await sql()`update staff set
      notify_open = coalesce(${p?.open ?? null}::boolean, notify_open),
      notify_remind = coalesce(${p?.remind ?? null}::boolean, notify_remind),
      notify_msg = coalesce(${p?.msg ?? null}::boolean, notify_msg),
      push_enabled = coalesce(${d?.push ?? null}::boolean, push_enabled),
      location_enabled = coalesce(${d?.location ?? null}::boolean, location_enabled),
      camera_enabled = coalesce(${d?.camera ?? null}::boolean, camera_enabled),
      installed = coalesce(${d?.installed ?? null}::boolean, installed)
    where id = ${staffId}`
  return getProfile(staffId)
}

export async function findActiveStaffId(email: string): Promise<string | null> {
  const [row] = await rows<{ id: string }>(
    sql()`select id from staff where lower(email) = lower(${email}) and active`,
  )
  return row?.id ?? null
}

/** Finishing onboarding turns an invited person into an active one (it is idempotent). */
export async function completeOnboarding(staffId: string): Promise<void> {
  await sql()`update staff set onboarded_at = coalesce(onboarded_at, now()) where id = ${staffId}`
}
