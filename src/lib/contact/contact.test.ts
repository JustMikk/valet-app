import { describe, expect, it } from "vitest"

import { e164, formatPhone, isUsNumber, parseLogin, phoneKey } from "./contact"

describe("phoneKey", () => {
  it("reads the same US number however it is typed", () => {
    for (const typed of [
      "(713) 555-0120",
      "713-555-0120",
      "7135550120",
      "+1 713 555 0120",
      "1.713.555.0120",
    ]) {
      expect(phoneKey(typed)).toBe("17135550120")
    }
  })

  it("keeps an international number's digits", () => {
    expect(phoneKey("+251 91 123 4567")).toBe("251911234567")
  })

  it("is null for anything too short or too long to be a phone number", () => {
    expect(phoneKey("555-0120")).toBeNull()
    expect(phoneKey("")).toBeNull()
    expect(phoneKey("1234567890123456")).toBeNull()
  })
})

describe("parseLogin", () => {
  it("treats anything with an @ as an email, lower-cased", () => {
    expect(parseLogin("  Jordan.Ellis@Gmail.com ")).toEqual({
      kind: "email",
      email: "jordan.ellis@gmail.com",
    })
  })

  it("treats a phone number as a phone", () => {
    expect(parseLogin("(713) 555-0120")).toEqual({ kind: "phone", key: "17135550120" })
  })

  it("rejects what is neither", () => {
    expect(parseLogin("jordan")).toBeNull()
    expect(parseLogin("jordan@")).toBeNull()
    expect(parseLogin("12345")).toBeNull()
  })
})

describe("formatPhone", () => {
  it("writes a US number the way it is usually written", () => {
    expect(formatPhone("713.555.0120")).toBe("(713) 555-0120")
  })

  it("writes an international number with a plus", () => {
    expect(formatPhone("+251 91 123 4567")).toBe("+251911234567")
  })
})

describe("e164", () => {
  it("writes any typed US number as +1 and ten digits", () => {
    expect(e164("(713) 555-0120")).toBe("+17135550120")
    expect(e164("+1 713 555 0120")).toBe("+17135550120")
  })

  it("keeps an international number's digits after a plus", () => {
    expect(e164("+251 91 123 4567")).toBe("+251911234567")
  })

  it("is null for what is not a phone number", () => {
    expect(e164("555-0120")).toBeNull()
    expect(e164("")).toBeNull()
  })
})

describe("isUsNumber", () => {
  it("is true only for +1 and ten digits", () => {
    expect(isUsNumber(e164("713-555-0120"))).toBe(true)
    expect(isUsNumber(e164("+251 91 123 4567"))).toBe(false)
    expect(isUsNumber(e164("+44 20 7946 0958"))).toBe(false)
  })

  it("is false when there is no number", () => {
    expect(isUsNumber(null)).toBe(false)
  })
})
