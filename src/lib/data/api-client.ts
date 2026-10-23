// HTTP client for the demo API. Every response is validated against its shared schema; a missing
// session is established silently with the demo sign-in (the real sign-in method is an owner
// decision, OPEN_QUESTIONS P1/H3), and one expired-token retry is attempted.
import { z } from "zod/mini"

import { SessionDto, type Session } from "./staff/schemas"

const TOKEN_KEY = "vw-staff-token"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(session: Session | null): void {
  try {
    if (session) localStorage.setItem(TOKEN_KEY, session.token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable: the session lives for this page load only.
  }
}

let memoryToken: string | null = null
let pendingSession: Promise<string> | null = null

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
export function setSession(session: Session): void {
  memoryToken = session.token
  writeToken(session)
}

export function clearSession(): void {
  memoryToken = null
  writeToken(null)
}

async function demoSession(): Promise<string> {
  pendingSession ??= (async () => {
    const res = await send("auth/demo", { method: "POST" })
    if (!res.ok) await fail(res)
    const session = SessionDto.parse(await res.json())
    setSession(session)
    return session.token
  })().finally(() => {
    pendingSession = null
  })
  return pendingSession
}

async function currentToken(): Promise<string> {
  memoryToken ??= readToken()
  return memoryToken ?? demoSession()
}

type Options = { method?: "GET" | "POST" | "PATCH"; body?: unknown; auth?: boolean }

export async function api<S extends z.ZodMiniType>(
  path: string,
  schema: S,
  { method = "GET", body, auth = true }: Options = {},
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

  let res = await request(auth ? await currentToken() : null)
  if (res.status === 401 && auth) {
    clearSession()
    res = await request(await demoSession())
  }
  if (!res.ok) await fail(res)
  return schema.parse(await res.json())
}
