// @vitest-environment node
import { createHmac } from "node:crypto"

import { describe, expect, it } from "vitest"

import type { SmsConfig } from "./config"
import { callbackIsFromTwilio, statusUpdate } from "./status"

const cfg = {
  authToken: "test-auth-token",
  statusUrl: "https://valet.example.com/api/sms/status",
} as SmsConfig

const params = {
  AccountSid: "AC00000000000000000000000000000001",
  MessageSid: "SM00000000000000000000000000000001",
  MessageStatus: "delivered",
}

// Signed the way Twilio signs (the algorithm is checked against Twilio's own example in
// twilio.test.ts); here it only produces a valid header for these inputs.
function sign(url: string, values: Record<string, string>, token = cfg.authToken): string {
  const data =
    url +
    Object.keys(values)
      .sort()
      .map((k) => k + values[k])
      .join("")
  return createHmac("sha1", token).update(data).digest("base64")
}

describe("callbackIsFromTwilio", () => {
  it("accepts a callback signed for our status URL", () => {
    expect(callbackIsFromTwilio(cfg, params, sign(cfg.statusUrl, params))).toBe(true)
  })

  it("refuses one signed for another URL, with another token, or not signed", () => {
    expect(
      callbackIsFromTwilio(cfg, params, sign("https://evil.example/api/sms/status", params)),
    ).toBe(false)
    expect(callbackIsFromTwilio(cfg, params, sign(cfg.statusUrl, params, "other-token"))).toBe(
      false,
    )
    expect(callbackIsFromTwilio(cfg, params, null)).toBe(false)
  })

  it("refuses everything while SMS is not configured", () => {
    expect(callbackIsFromTwilio(null, params, sign(cfg.statusUrl, params))).toBe(false)
  })
})

describe("statusUpdate", () => {
  it("reads the message and its new status", () => {
    expect(statusUpdate({ MessageSid: "SM1", MessageStatus: "sent" })).toEqual({
      sid: "SM1",
      status: "sent",
      errorCode: null,
      final: false,
    })
  })

  it("keeps the error of an undelivered or failed text, and marks it final", () => {
    expect(
      statusUpdate({ MessageSid: "SM1", MessageStatus: "undelivered", ErrorCode: "30003" }),
    ).toEqual({ sid: "SM1", status: "undelivered", errorCode: 30003, final: true })
  })

  it("reads an unsubscribed recipient (21610) as opted out", () => {
    expect(
      statusUpdate({ MessageSid: "SM1", MessageStatus: "failed", ErrorCode: "21610" }),
    ).toEqual({ sid: "SM1", status: "opted_out", errorCode: 21610, final: true })
  })

  it("treats delivered as final, so a late 'sent' cannot overwrite it", () => {
    expect(statusUpdate({ MessageSid: "SM1", MessageStatus: "delivered" })?.final).toBe(true)
    expect(statusUpdate({ MessageSid: "SM1", MessageStatus: "sending" })?.final).toBe(false)
  })

  it("ignores a callback without a message or a status", () => {
    expect(statusUpdate({ MessageStatus: "sent" })).toBeNull()
    expect(statusUpdate({ MessageSid: "SM1" })).toBeNull()
  })
})
