// SMS configuration (ADR-026). Texts go only when every Twilio value and a sender are set; with
// anything missing SMS is off, nothing is sent and nothing fails. Credentials come only from the
// environment: unlike the demo's Pusher app, a Twilio key sends paid texts, so none is committed.
import { e164, type E164 } from "@/lib/contact/contact"

import { env, type Env } from "../env"

export type SmsSender = { kind: "service"; sid: string } | { kind: "number"; from: E164 }

export type SmsConfig = {
  accountSid: string
  keySid: string
  keySecret: string
  /** Signs Twilio's status callbacks. */
  authToken: string
  sender: SmsSender
  /** Public origin, no trailing slash: links in texts and the callback URL Twilio signs. */
  appUrl: string
  statusUrl: string
}

type SmsVars = Partial<
  Pick<
    Env,
    | "TWILIO_ACCOUNT_SID"
    | "TWILIO_API_KEY_SID"
    | "TWILIO_API_KEY_SECRET"
    | "TWILIO_AUTH_TOKEN"
    | "TWILIO_MESSAGING_SERVICE_SID"
    | "TWILIO_FROM_NUMBER"
    | "APP_URL"
  >
>

const filled = (value: string | undefined): string | null => value?.trim() || null

function origin(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null
  } catch {
    return null
  }
}

/** The SMS configuration these variables describe, or null when SMS is off. */
export function smsConfigFrom(vars: SmsVars): SmsConfig | null {
  const accountSid = filled(vars.TWILIO_ACCOUNT_SID)
  const keySid = filled(vars.TWILIO_API_KEY_SID)
  const keySecret = filled(vars.TWILIO_API_KEY_SECRET)
  const authToken = filled(vars.TWILIO_AUTH_TOKEN)
  const appUrl = origin(filled(vars.APP_URL))
  if (!accountSid || !keySid || !keySecret || !authToken || !appUrl) return null

  const serviceSid = filled(vars.TWILIO_MESSAGING_SERVICE_SID)
  const fromText = filled(vars.TWILIO_FROM_NUMBER)
  const from = fromText ? e164(fromText) : null
  const sender: SmsSender | null = serviceSid
    ? { kind: "service", sid: serviceSid }
    : from
      ? { kind: "number", from }
      : null
  if (!sender) return null

  return {
    accountSid,
    keySid,
    keySecret,
    authToken,
    sender,
    appUrl,
    statusUrl: `${appUrl}/api/sms/status`,
  }
}

/** This server's SMS configuration, or null when SMS is off. */
export function smsConfig(): SmsConfig | null {
  return smsConfigFrom(env())
}
