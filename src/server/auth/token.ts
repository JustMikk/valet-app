// Stateless session tokens: base64url(payload).base64url(HMAC-SHA256). Demo-grade sign-in (the real
// method is an owner decision, OPEN_QUESTIONS P1/H3), but the signature check is the real thing:
// constant-time comparison, expiry enforced, secret from the environment. A token names who it is
// for and in which role (staff or admin); tokens issued before roles existed read as staff.
import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "../env"

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type Role = "staff" | "admin"
export type Principal = { id: string; role: Role }

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url")

function sign(payload: string): Buffer {
  return createHmac("sha256", env().SESSION_SECRET).update(payload).digest()
}

export function issueToken(
  id: string,
  role: Role = "staff",
  now: number = Date.now(),
): { token: string; expiresAt: string } {
  const expires = now + SESSION_TTL_MS
  const payload = encode(JSON.stringify({ sub: id, role, exp: expires }))
  return {
    token: `${payload}.${encode(sign(payload))}`,
    expiresAt: new Date(expires).toISOString(),
  }
}

/** Who a valid, unexpired token belongs to, otherwise null. */
export function verifyToken(token: string, now: number = Date.now()): Principal | null {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra !== undefined) return null
  const expected = sign(payload)
  const given = Buffer.from(signature, "base64url")
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (typeof claims !== "object" || claims === null) return null
    const { sub, exp, role } = claims as { sub?: unknown; exp?: unknown; role?: unknown }
    if (typeof sub !== "string" || typeof exp !== "number" || exp <= now) return null
    if (role !== undefined && role !== "staff" && role !== "admin") return null
    return { id: sub, role: role ?? "staff" }
  } catch {
    return null
  }
}
