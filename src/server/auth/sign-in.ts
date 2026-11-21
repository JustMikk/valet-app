// Sign-in. Staff are recognised by their email or phone number alone: one that is on the team gets
// in, with no password or code (owner decision, ADR-025). Admins use their email or phone number
// and a password. The onboarding screens' code step still accepts a fixed demo code. Everything
// downstream (signed token, scoped queries) is the real mechanism.
import { parseLogin } from "@/lib/contact/contact"
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

const unknownStaff = () =>
  new ApiError(
    401,
    "unknown_login",
    "We can't find that email or phone number. Ask your admin to invite you, or check it.",
  )

/** The valet an email or phone number belongs to, or null (also for text that is neither). */
async function staffFor(login: string): Promise<string | null> {
  const parsed = parseLogin(login)
  return parsed ? findActiveStaffId(parsed) : null
}

export async function verifyCode(login: string, code: string): Promise<Session> {
  const staffId = await staffFor(login)
  // One message for both failures, so the response never confirms who is on the team.
  if (!staffId || code !== DEMO_CODE) {
    throw new ApiError(401, "invalid_code", "That code isn't right. Check it and try again.")
  }
  return issueToken(staffId, "staff")
}

/** One-tap session for the demo's default worker or dispatcher; only when DEMO_MODE=1. */
export async function demoSession(role: Role = "staff"): Promise<Session> {
  if (!demoEnabled()) throw new ApiError(404, "not_found", "Not found.")
  if (role === "staff") {
    const staffId = await staffFor(DEMO_STAFF_EMAIL)
    if (staffId) return issueToken(staffId, "staff")
  } else {
    const [admin] = await rows<{ id: string }>(
      sql()`select id from admins where lower(email) = lower(${DEMO_ADMIN_EMAIL})`,
    )
    if (admin) return issueToken(admin.id, "admin")
  }
  throw new ApiError(404, "not_found", "Not found.")
}

/** A staff member on the team signs in with their email or phone number alone. */
export async function staffSignIn(login: string): Promise<Session> {
  const staffId = await staffFor(login)
  if (!staffId) throw unknownStaff()
  return issueToken(staffId, "staff")
}

/** An admin signs in with email or phone and a password; one message for any of them being wrong. */
export async function adminSignIn(login: string, password: string): Promise<Session> {
  const parsed = parseLogin(login)
  const [admin] = parsed
    ? await rows<{ id: string; password_hash: string | null }>(
        parsed.kind === "email"
          ? sql()`select id, password_hash from admins where lower(email) = ${parsed.email}`
          : sql()`select id, password_hash from admins where phone_key = ${parsed.key}`,
      )
    : []
  if (!verifyPassword(password, admin?.password_hash ?? null) || !admin) {
    throw new ApiError(
      401,
      "invalid_credentials",
      "That email or phone number and password don't match.",
    )
  }
  return issueToken(admin.id, "admin")
}
