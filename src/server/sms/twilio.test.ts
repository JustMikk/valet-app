// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

import { e164, type E164 } from "@/lib/contact/contact"

import type { SmsConfig } from "./config"
import { parseSendResponse, sendRequest, sendSms, validSignature } from "./twilio"

const to = e164("(713) 555-0144") as E164

// Stand-in values in Twilio's formats; none of them is a real credential.
const cfg: SmsConfig = {
  accountSid: "AC00000000000000000000000000000001",
  keySid: "test-api-key-sid",
  keySecret: "test-key-secret",
  authToken: "test-auth-token",
  sender: { kind: "service", sid: "MG00000000000000000000000000000001" },
  appUrl: "https://valet.example.com",
  statusUrl: "https://valet.example.com/api/sms/status",
}

describe("sendRequest", () => {
  it("posts the message form to the account's Messages endpoint with API-key Basic auth", () => {
    const request = sendRequest(cfg, to, "Hello")
    expect(request.url).toBe(
      "https://api.twilio.com/2010-04-01/Accounts/AC00000000000000000000000000000001/Messages.json",
    )
    const expected = Buffer.from("test-api-key-sid:test-key-secret").toString("base64")
    expect(request.headers.authorization).toBe(`Basic ${expected}`)
    expect(Object.fromEntries(request.form)).toEqual({
      To: "+17135550144",
      Body: "Hello",
      StatusCallback: "https://valet.example.com/api/sms/status",
      MessagingServiceSid: "MG00000000000000000000000000000001",
    })
  })

  it("sends From instead when the sender is a single number", () => {
    const request = sendRequest(
      { ...cfg, sender: { kind: "number", from: e164("+17135550100") as E164 } },
      to,
      "Hello",
    )
    expect(request.form.get("From")).toBe("+17135550100")
    expect(request.form.has("MessagingServiceSid")).toBe(false)
  })
})

describe("parseSendResponse", () => {
  it("reads a created message", () => {
    expect(parseSendResponse(201, { sid: "SM123", status: "accepted" })).toEqual({
      ok: true,
      sid: "SM123",
      status: "accepted",
    })
  })

  it("reads an opted-out recipient (21610) as opted out", () => {
    expect(
      parseSendResponse(400, { code: 21610, message: "Attempt to send to unsubscribed recipient" }),
    ).toEqual({
      ok: false,
      code: 21610,
      optedOut: true,
      message: "Attempt to send to unsubscribed recipient",
    })
  })

  it("reads any other error with its code", () => {
    expect(parseSendResponse(429, { code: 20429, message: "Too Many Requests" })).toEqual({
      ok: false,
      code: 20429,
      optedOut: false,
      message: "Too Many Requests",
    })
  })

  it("survives a body it does not recognise", () => {
    expect(parseSendResponse(500, "<html>oops</html>")).toEqual({
      ok: false,
      code: null,
      optedOut: false,
      message: "Twilio responded 500",
    })
    expect(parseSendResponse(201, { unexpected: true })).toMatchObject({ ok: false, code: null })
  })
})

describe("sendSms", () => {
  it("returns the parsed result of the call", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ sid: "SM9", status: "queued" }, { status: 201 }),
    )
    await expect(sendSms(cfg, to, "Hi", fetcher)).resolves.toEqual({
      ok: true,
      sid: "SM9",
      status: "queued",
    })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it("never throws: a network failure is a failed result", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("fetch failed")
    })
    await expect(sendSms(cfg, to, "Hi", fetcher)).resolves.toEqual({
      ok: false,
      code: null,
      optedOut: false,
      message: "fetch failed",
    })
  })
})

describe("validSignature", () => {
  // Twilio's worked example, https://www.twilio.com/docs/usage/security ("Explore the algorithm
  // yourself"): these inputs sign to the expected value below.
  const authToken = "12345"
  const url = "https://example.com/myapp.php?foo=1&bar=2"
  const params = {
    Digits: "1234",
    To: "+18005551212",
    From: "+14158675310",
    Caller: "+14158675310",
    CallSid: "CA1234567890ABCDE",
  }
  const expected = "L/OH5YylLD5NRKLltdqwSvS0BnU="

  it("accepts Twilio's documented example", () => {
    expect(validSignature(authToken, url, params, expected)).toBe(true)
  })

  it("rejects a changed parameter, URL, token or signature", () => {
    expect(validSignature(authToken, url, { ...params, Digits: "1235" }, expected)).toBe(false)
    expect(validSignature(authToken, `${url}&x=1`, params, expected)).toBe(false)
    expect(validSignature("54321", url, params, expected)).toBe(false)
    expect(validSignature(authToken, url, params, "L/OH5YylLD5NRKLltdqwSvS0BnV=")).toBe(false)
  })

  it("rejects a missing or malformed header", () => {
    expect(validSignature(authToken, url, params, null)).toBe(false)
    expect(validSignature(authToken, url, params, "")).toBe(false)
    expect(validSignature(authToken, url, params, "not base64 at all")).toBe(false)
  })
})
