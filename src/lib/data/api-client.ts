// HTTP client for the demo API. Every response is validated against its shared schema. A request
// with no session, or one the server rejects as expired, sends the person to the sign-in page. The
// staff and admin apps keep separate sessions, so one browser can use both.
import { z } from "zod/mini"

import { SessionDto, type Session } from "./staff/schemas"

export type Role = "staff" | "admin"
const TOKEN_KEYS: Record<Role, string> = { staff: "vw-staff-token", admin: "vw-admin-token" }

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function readToken(role: Role = "staff"): string | null {
  try {
    return localStorage.getItem(TOKEN_KEYS[role])
  } catch {
    return null
  }
}

export function writeToken(session: Session | null, role: Role = "staff"): void {
  try {
    if (session) localStorage.setItem(TOKEN_KEYS[role], session.token)
    else localStorage.removeItem(TOKEN_KEYS[role])
  } catch {
    // Storage unavailable: the session lives for this page load only.
  }
}

const memoryTokens: Record<Role, string | null> = { staff: null, admin: null }

const ErrorBody = z.object({ error: z.object({ code: z.string(), message: z.string() }) })

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api/${path}`, init)
  } catch {
    throw new ApiError(0, "network", "You're offline or the server can't be reached.")
  }
}

async function fail(res: Response): Promise<never> {
  const body = ErrorBody.safeParse(await res.json().catch(() => null))
  throw body.success
    ? new ApiError(res.status, body.data.error.code, body.data.error.message)
    : new ApiError(res.status, "http_error", `Request failed (${res.status}).`)
}

/** Stores a session from sign-in (or the demo shortcut) for later requests. */
export function setSession(session: Session, role: Role = "staff"): void {
  memoryTokens[role] = session.token
  writeToken(session, role)
}

export function clearSession(role: Role = "staff"): void {
  memoryTokens[role] = null
  writeToken(null, role)
}

/** One-tap demo session (only works when the server runs with DEMO_MODE=1): the /demo page. */
export async function startDemoSession(role: Role): Promise<void> {
  const res = await send("auth/demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) await fail(res)
  setSession(SessionDto.parse(await res.json()), role)
}

// Pages a person can be on without a session: they sign in from there.
const OPEN_PATHS = ["/", "/login", "/demo"]

function toSignIn(role: Role): void {
  if (typeof window === "undefined") return
  const path = window.location.pathname.replace(/\/$/, "") || "/"
  if (OPEN_PATHS.includes(path) || path.startsWith("/staff/onboarding")) return
  const next = encodeURIComponent(path + window.location.search)
  window.location.replace(`/login?role=${role}&next=${next}`)
}

const signedOut = () => new ApiError(401, "unauthorized", "Sign in to continue.")

function currentToken(role: Role): string {
  memoryTokens[role] ??= readToken(role)
  const token = memoryTokens[role]
  if (!token) {
    toSignIn(role)
    throw signedOut()
  }
  return token
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  /** Which app's session to use (default staff). */
  as?: Role
}

export async function api<S extends z.ZodMiniType>(
  path: string,
  schema: S,
  { method = "GET", body, auth = true, as = "staff" }: Options = {},
): Promise<z.output<S>> {
  const request = async (token: string | null) =>
    send(path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const res = await request(auth ? currentToken(as) : null)
  if (res.status === 401 && auth) {
    // Expired or unknown token: forget it and ask for a fresh sign-in.
    clearSession(as)
    toSignIn(as)
    throw signedOut()
  }
  if (!res.ok) await fail(res)
  return schema.parse(await res.json())
}
