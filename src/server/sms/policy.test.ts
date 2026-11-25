// @vitest-environment node
import { describe, expect, it } from "vitest"

import { dedupeKey, inviteLink, shiftLink, smsTarget, textReach } from "./policy"

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
    // A shift's page goes by its short link, so the event name fits one segment (/s forwards).
    expect(
      shiftLink(
        "https://valet.example.com",
        "/staff/shifts/detail?id=707f8150-0caa-47d4-a29c-fe796f77da20",
      ),
    ).toBe("https://valet.example.com/s?i=707f8150-0caa-47d4-a29c-fe796f77da20")
  })
})

describe("textReach", () => {
  it("says whether texts reach a valet, in the admin's words", () => {
    expect(textReach(true, "(713) 555-0144", null)).toBe("On")
    expect(textReach(true, "(713) 555-0144", "delivered")).toBe("On")
    expect(textReach(true, "(713) 555-0144", "opted_out")).toBe("Opted out (replied STOP)")
    expect(textReach(true, "+251 91 123 4567", null)).toBe("Not a US number")
    expect(textReach(true, "", null)).toBe("No phone number")
    expect(textReach(false, "(713) 555-0144", null)).toBe("Not set up")
  })
})
