// @vitest-environment node
import { describe, expect, it } from "vitest"

import { smsConfigFrom } from "./config"

// Stand-in values in Twilio's formats; none of them is a real credential.
const base = {
  TWILIO_ACCOUNT_SID: "AC00000000000000000000000000000001",
  TWILIO_API_KEY_SID: "test-api-key-sid",
  TWILIO_API_KEY_SECRET: "test-key-secret",
  TWILIO_AUTH_TOKEN: "test-auth-token",
  APP_URL: "https://valet.example.com",
}

describe("smsConfigFrom", () => {
  it("prefers a Messaging Service as the sender", () => {
    const cfg = smsConfigFrom({
      ...base,
      TWILIO_MESSAGING_SERVICE_SID: "MG00000000000000000000000000000001",
      TWILIO_FROM_NUMBER: "+17135550100",
    })
    expect(cfg?.sender).toEqual({
      kind: "service",
      sid: "MG00000000000000000000000000000001",
    })
  })

  it("falls back to a single From number, written as E.164", () => {
    const cfg = smsConfigFrom({ ...base, TWILIO_FROM_NUMBER: "(713) 555-0100" })
    expect(cfg?.sender).toEqual({ kind: "number", from: "+17135550100" })
  })

  it("builds the status callback URL from APP_URL, ignoring a trailing slash", () => {
    const cfg = smsConfigFrom({
      ...base,
      APP_URL: "https://valet.example.com/",
      TWILIO_FROM_NUMBER: "+17135550100",
    })
    expect(cfg?.appUrl).toBe("https://valet.example.com")
    expect(cfg?.statusUrl).toBe("https://valet.example.com/api/sms/status")
  })

  it("is off without a sender", () => {
    expect(smsConfigFrom(base)).toBeNull()
  })

  it("is off when any required value is missing or blank", () => {
    const withSender = { ...base, TWILIO_FROM_NUMBER: "+17135550100" }
    for (const name of Object.keys(base)) {
      expect(smsConfigFrom({ ...withSender, [name]: undefined })).toBeNull()
      expect(smsConfigFrom({ ...withSender, [name]: "  " })).toBeNull()
    }
  })

  it("is off when APP_URL is not an http(s) origin or the From number is not a number", () => {
    expect(
      smsConfigFrom({ ...base, APP_URL: "valet.example.com", TWILIO_FROM_NUMBER: "+17135550100" }),
    ).toBeNull()
    expect(smsConfigFrom({ ...base, TWILIO_FROM_NUMBER: "not a number" })).toBeNull()
  })
})
