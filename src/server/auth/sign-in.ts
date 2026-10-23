// Demo sign-in. The real method is an owner decision (OPEN_QUESTIONS P1/H3: no SMS), so "email me
// a code" accepts a fixed code instead of sending mail; everything downstream (signed token, scoped
// queries) is the real mechanism. The code matches the onboarding design.
import type { Session } from "@/lib/data/staff/schemas"

import { demoEnabled } from "../env"
import { ApiError } from "../http/handler"
import { rows, sql } from "../db/client"
import { findActiveStaffId } from "../staff/profile"
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
