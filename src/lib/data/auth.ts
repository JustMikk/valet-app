// Signing in and out. In the server build these call the sign-in endpoints; in the static (fixture)
// build there is no server, so signing in just lets the person through.

import { api, clearSession, setSession, startDemoSession, type Role } from "./api-client"
import { SessionDto } from "./staff/schemas"

const live = () => process.env.NEXT_PUBLIC_DATA_SOURCE === "api"

/** A staff member signs in with their email or phone number alone; it must be on the team. */
export async function signInStaff(login: string): Promise<void> {
  if (!live()) return
  setSession(
    await api("auth/staff", SessionDto, { method: "POST", body: { login }, auth: false }),
    "staff",
  )
}

/** An admin signs in with their email or phone number and a password. */
export async function signInAdmin(login: string, password: string): Promise<void> {
  if (!live()) return
  setSession(
    await api("auth/admin", SessionDto, {
      method: "POST",
      body: { login, password },
      auth: false,
    }),
    "admin",
  )
}

/** The demo page's one-tap session (needs DEMO_MODE=1 on the server). */
export async function signInDemo(role: Role): Promise<void> {
  if (live()) await startDemoSession(role)
}

export function signOut(role: Role): void {
  clearSession(role)
}
