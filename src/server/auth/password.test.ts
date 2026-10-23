import { describe, expect, it } from "vitest"

import { hashPassword, verifyPassword } from "./password"

describe("passwords", () => {
  it("accepts the right password and refuses a wrong one", () => {
    const stored = hashPassword("correct horse")
    expect(verifyPassword("correct horse", stored)).toBe(true)
    expect(verifyPassword("correct horse!", stored)).toBe(false)
    expect(verifyPassword("", stored)).toBe(false)
  })

  it("salts every hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"))
  })

  it("never accepts an account with no password or a malformed hash", () => {
    expect(verifyPassword("anything", null)).toBe(false)
    expect(verifyPassword("anything", "")).toBe(false)
    expect(verifyPassword("anything", "scrypt$zz")).toBe(false)
    expect(verifyPassword("anything", "plain-text")).toBe(false)
  })
})
