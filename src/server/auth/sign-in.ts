// Demo sign-in. The real method is an owner decision (OPEN_QUESTIONS P1/H3: no SMS), so "email me
// a code" accepts a fixed code instead of sending mail; everything downstream (signed token, scoped
// queries) is the real mechanism. The code matches the onboarding design.
import type { Session } from "@/lib/data/staff/schemas"

import { demoEnabled } from "../env"
import { ApiError } from "../http/handler"
import { findActiveStaffId } from "../staff/profile"
import { issueToken } from "./token"

export const DEMO_CODE = "482913"
const DEMO_STAFF_EMAIL = "jordan.ellis@gmail.com"

export async function verifyCode(email: string, code: string): Promise<Session> {
  const staffId = await findActiveStaffId(email)
  // One message for both failures, so the response never confirms which emails exist.
  if (!staffId || code !== DEMO_CODE) {
    throw new ApiError(401, "invalid_code", "That code isn't right. Check it and try again.")
  }
  return issueToken(staffId)
}

/** One-tap session for the demo's default worker; only when DEMO_MODE=1. */
export async function demoSession(): Promise<Session> {
  const staffId = demoEnabled() ? await findActiveStaffId(DEMO_STAFF_EMAIL) : null
  if (!staffId) throw new ApiError(404, "not_found", "Not found.")
  return issueToken(staffId)
}
