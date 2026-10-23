// Sign-in. Staff are recognised by their email alone: an email that is on the team gets in, with no
// password or code (owner decision). Dispatchers use email and password. The onboarding screens'
// "email me a code" still accepts a fixed demo code. Everything downstream (signed token, scoped
// queries) is the real mechanism.
import type { Session } from "@/lib/data/staff/schemas"

import { demoEnabled } from "../env"
import { ApiError } from "../http/handler"
import { rows, sql } from "../db/client"
import { findActiveStaffId } from "../staff/profile"
import { verifyPassword } from "./password"
import { issueToken, type Role } from "./token"

export const DEMO_CODE = "482913"
const DEMO_STAFF_EMAIL = "jordan.ellis@gmail.com"
const DEMO_ADMIN_EMAIL = "jamie.cole@regencyvalet.com"

export async function verifyCode(email: string, code: string): Promise<Session> {
  const staffId = await findActiveStaffId(email)
  // One message for both failures, so the response never confirms which emails exist.
  if (!staffId || code !== DEMO_CODE) {
    throw new ApiError(401, "invalid_code", "That code isn't right. Check it and try again.")
  }
  return issueToken(staffId, "staff")
}

/** One-tap session for the demo's default worker or dispatcher; only when DEMO_MODE=1. */
export async function demoSession(role: Role = "staff"): Promise<Session> {
  if (!demoEnabled()) throw new ApiError(404, "not_found", "Not found.")
  if (role === "staff") {
    const staffId = await findActiveStaffId(DEMO_STAFF_EMAIL)
    if (staffId) return issueToken(staffId, "staff")
  } else {
    const [admin] = await rows<{ id: string }>(
      sql()`select id from admins where lower(email) = lower(${DEMO_ADMIN_EMAIL})`,
    )
    if (admin) return issueToken(admin.id, "admin")
  }
  throw new ApiError(404, "not_found", "Not found.")
}

/** A staff member on the team signs in with their email alone. */
export async function staffSignIn(email: string): Promise<Session> {
  const staffId = await findActiveStaffId(email)
  if (!staffId) {
    throw new ApiError(
      401,
      "unknown_email",
      "We can't find that email. Ask dispatch to invite you, or check the spelling.",
    )
  }
  return issueToken(staffId, "staff")
}

/** A dispatcher signs in with email and password; one message for either being wrong. */
export async function adminSignIn(email: string, password: string): Promise<Session> {
  const [admin] = await rows<{ id: string; password_hash: string | null }>(
    sql()`select id, password_hash from admins where lower(email) = lower(${email})`,
  )
  if (!verifyPassword(password, admin?.password_hash ?? null) || !admin) {
    throw new ApiError(401, "invalid_credentials", "That email and password don't match.")
  }
  return issueToken(admin.id, "admin")
}
