// Twilio Programmable Messaging over REST, without the SDK (ADR-026), as the Pusher publisher does.
// Sending is best effort: a failed text never fails the action that caused it, so `sendSms` returns
// a result to log and never throws. Callback signatures follow https://www.twilio.com/docs/usage/
// security, checked against that page's worked example in twilio.test.ts.
import { createHmac, timingSafeEqual } from "node:crypto"

import { z } from "zod/mini"

import type { E164 } from "@/lib/contact/contact"

import type { SmsConfig } from "./config"

const API = "https://api.twilio.com/2010-04-01"
/** The whole send, including Twilio's response, must fit in this; texts never hold up a request. */
export const SEND_BUDGET_MS = 3000
/** "Attempt to send to unsubscribed recipient": they replied STOP to our sender. */
export const OPTED_OUT = 21610

export type SendResult =
  | { ok: true; sid: string; status: string }
  | { ok: false; code: number | null; optedOut: boolean; message: string }

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export function sendRequest(cfg: SmsConfig, to: E164, body: string) {
  const form = new URLSearchParams({ To: to, Body: body, StatusCallback: cfg.statusUrl })
  if (cfg.sender.kind === "service") form.set("MessagingServiceSid", cfg.sender.sid)
  else form.set("From", cfg.sender.from)
  const credentials = Buffer.from(`${cfg.keySid}:${cfg.keySecret}`).toString("base64")
  return {
    url: `${API}/Accounts/${encodeURIComponent(cfg.accountSid)}/Messages.json`,
    headers: { authorization: `Basic ${credentials}` },
    form,
  }
}

const Created = z.object({ sid: z.string(), status: z.string() })
const Failure = z.object({
  code: z.optional(z.nullable(z.number())),
  message: z.optional(z.nullable(z.string())),
})

const failed = (code: number | null, message: string): SendResult => ({
  ok: false,
  code,
  optedOut: code === OPTED_OUT,
  message,
})

/** Twilio's answer to a send: the message's sid and status, or the error it gave. */
export function parseSendResponse(httpStatus: number, json: unknown): SendResult {
  if (httpStatus >= 200 && httpStatus < 300) {
    const created = Created.safeParse(json)
    return created.success
      ? { ok: true, sid: created.data.sid, status: created.data.status }
      : failed(null, `Twilio responded ${httpStatus} without a message sid`)
  }
  const error = Failure.safeParse(json)
  const code = error.success ? (error.data.code ?? null) : null
  const message = (error.success ? error.data.message : null) ?? `Twilio responded ${httpStatus}`
  return failed(code, message)
}

/** Sends one text. Never throws: network errors, timeouts and odd answers are failed results. */
export async function sendSms(
  cfg: SmsConfig,
  to: E164,
  body: string,
  fetcher: Fetcher = fetch,
): Promise<SendResult> {
  try {
    const request = sendRequest(cfg, to, body)
    const response = await fetcher(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.form,
      signal: AbortSignal.timeout(SEND_BUDGET_MS),
    })
    const json: unknown = await response.json().catch(() => null)
    return parseSendResponse(response.status, json)
  } catch (error) {
    return failed(null, error instanceof Error ? error.message : "Send failed")
  }
}

/**
 * Whether a callback really came from Twilio: base64(HMAC-SHA1(authToken, url + each POST
 * parameter's name and value, sorted by name)), compared in constant time. `url` must be the exact
 * public URL Twilio called, query string included.
 */
export function validSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  header: string | null,
): boolean {
  if (!header) return false
  const signed =
    url +
    Object.keys(params)
      .sort()
      .map((name) => name + params[name])
      .join("")
  // Compare the base64 text itself, not decoded bytes: decoding would also accept other spellings
  // of the same digest (e.g. a changed padding bit), which Twilio never sends.
  const expected = Buffer.from(
    createHmac("sha1", authToken).update(signed, "utf8").digest("base64"),
  )
  const given = Buffer.from(header)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
