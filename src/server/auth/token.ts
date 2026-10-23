// Stateless session tokens: base64url(payload).base64url(HMAC-SHA256). Demo-grade sign-in (the real
// method is an owner decision, OPEN_QUESTIONS P1/H3), but the signature check is the real thing:
// constant-time comparison, expiry enforced, secret from the environment.
import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "../env"

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url")

function sign(payload: string): Buffer {
  return createHmac("sha256", env().SESSION_SECRET).update(payload).digest()
}

export function issueToken(
  staffId: string,
  now: number = Date.now(),
): { token: string; expiresAt: string } {
  const expires = now + SESSION_TTL_MS
  const payload = encode(JSON.stringify({ sub: staffId, exp: expires }))
  return {
    token: `${payload}.${encode(sign(payload))}`,
    expiresAt: new Date(expires).toISOString(),
  }
}

/** The staff id inside a valid, unexpired token, otherwise null. */
export function verifyToken(token: string, now: number = Date.now()): string | null {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra !== undefined) return null
  const expected = sign(payload)
  const given = Buffer.from(signature, "base64url")
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (typeof claims !== "object" || claims === null) return null
    const { sub, exp } = claims as { sub?: unknown; exp?: unknown }
    if (typeof sub !== "string" || typeof exp !== "number" || exp <= now) return null
    return sub
  } catch {
    return null
  }
}
