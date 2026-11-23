// @vitest-environment node
import { describe, expect, it } from "vitest"

import { dedupeKey, inviteLink, shiftLink, smsTarget } from "./policy"

describe("smsTarget", () => {
  it("texts a US number, keeping only its last 4 digits for the log", () => {
    expect(smsTarget(true, "(713) 555-0144")).toEqual({
      ok: true,
      to: "+17135550144",
      last4: "0144",
    })
  })

  it("says why it will not text", () => {
    expect(smsTarget(false, "(713) 555-0144")).toEqual({ ok: false, reason: "not_configured" })
    expect(smsTarget(true, "")).toEqual({ ok: false, reason: "no_phone" })
    expect(smsTarget(true, null)).toEqual({ ok: false, reason: "no_phone" })
    expect(smsTarget(true, "555-0144")).toEqual({ ok: false, reason: "no_phone" })
    expect(smsTarget(true, "+251 91 123 4567")).toEqual({ ok: false, reason: "not_us" })
  })
})

describe("dedupeKey", () => {
  const staff = "00000000-0000-4000-8000-000000000101"

  it("is the same for the same text to the same person", () => {
    expect(dedupeKey("assigned", staff, "Regency: You're assigned")).toBe(
      dedupeKey("assigned", staff, "Regency: You're assigned"),
    )
  })

  it("differs when the text, the kind or the person differs", () => {
    const key = dedupeKey("rescheduled", staff, "new time: 5 PM")
    expect(dedupeKey("rescheduled", staff, "new time: 6 PM")).not.toBe(key)
    expect(dedupeKey("assigned", staff, "new time: 5 PM")).not.toBe(key)
    expect(
      dedupeKey("rescheduled", "00000000-0000-4000-8000-000000000102", "new time: 5 PM"),
    ).not.toBe(key)
  })

  it("carries no part of the message itself", () => {
    expect(dedupeKey("assigned", staff, "secret words")).not.toContain("secret")
  })
})

describe("links", () => {
  it("opens sign-in with the invited number filled in", () => {
    expect(inviteLink("https://valet.example.com", "+17135550144" as never)).toBe(
      "https://valet.example.com/login?role=staff&login=%2B17135550144",
    )
  })

  it("points a shift text at a page of the staff app", () => {
    expect(shiftLink("https://valet.example.com", "/staff/shifts")).toBe(
      "https://valet.example.com/staff/shifts",
    )
    expect(shiftLink("https://valet.example.com", "staff/shifts/detail?id=abc")).toBe(
      "https://valet.example.com/staff/shifts/detail?id=abc",
    )
  })
})
