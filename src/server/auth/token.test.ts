// @vitest-environment node
import { randomBytes } from "node:crypto"

import { beforeAll, describe, expect, it } from "vitest"

import { SESSION_TTL_MS, issueToken, verifyToken } from "./token"

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://unused"
  process.env.SESSION_SECRET = randomBytes(32).toString("hex")
})

describe("session tokens", () => {
  const NOW = Date.parse("2026-10-23T12:00:00Z")

  it("round-trips the staff id", () => {
    const { token } = issueToken("staff-1", NOW)
    expect(verifyToken(token, NOW + 1000)).toBe("staff-1")
  })

  it("reports when it expires", () => {
    expect(issueToken("s", NOW).expiresAt).toBe(new Date(NOW + SESSION_TTL_MS).toISOString())
  })

  it("rejects an expired token", () => {
    const { token } = issueToken("staff-1", NOW)
    expect(verifyToken(token, NOW + SESSION_TTL_MS)).toBeNull()
    expect(verifyToken(token, NOW + SESSION_TTL_MS - 1)).toBe("staff-1")
  })

  it("rejects a tampered payload or signature", () => {
    const { token } = issueToken("staff-1", NOW)
    const [payload, signature] = token.split(".")
    const forged = Buffer.from(JSON.stringify({ sub: "staff-2", exp: NOW + 1e9 })).toString(
      "base64url",
    )
    expect(verifyToken(`${forged}.${signature}`, NOW)).toBeNull()
    expect(verifyToken(`${payload}.${signature?.slice(0, -2)}AA`, NOW)).toBeNull()
  })

  it("rejects malformed tokens without throwing", () => {
    for (const bad of ["", "abc", "a.b.c", ".", "a."]) expect(verifyToken(bad, NOW)).toBeNull()
  })
})
