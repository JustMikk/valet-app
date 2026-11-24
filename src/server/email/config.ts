// Email configuration (ADR-027). Email goes only when the Resend key, a sender and the app's public
// URL are set; with anything missing email is off, nothing is sent and invites still work. The key
// comes only from the environment: like a Twilio key (ADR-026) it sends mail in the company's name.
import { env, type Env } from "../env"

export type EmailConfig = {
  apiKey: string
  /** "Regency Parking Service <invoices@example.com>" or a bare address. */
  from: string
  replyTo: string | null
  /** Public origin, no trailing slash: the sign-in link in an invite. */
  appUrl: string
}

type EmailVars = Partial<Pick<Env, "RESEND_API_KEY" | "EMAIL_FROM" | "EMAIL_REPLY_TO" | "APP_URL">>

const filled = (value: string | undefined): string | null => value?.trim() || null

/** A bare address, or "Name <address>". */
const SENDER = /^(?:[^<>]*<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/
const ADDRESS = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/

function origin(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null
  } catch {
    return null
  }
}

/** The email configuration these variables describe, or null when email is off. */
export function emailConfigFrom(vars: EmailVars): EmailConfig | null {
  const apiKey = filled(vars.RESEND_API_KEY)
  const from = filled(vars.EMAIL_FROM)
  const appUrl = origin(filled(vars.APP_URL))
  if (!apiKey || !from || !SENDER.test(from) || !appUrl) return null
  const replyTo = filled(vars.EMAIL_REPLY_TO)
  return { apiKey, from, replyTo: replyTo && ADDRESS.test(replyTo) ? replyTo : null, appUrl }
}

/** This server's email configuration, or null when email is off. */
export function emailConfig(): EmailConfig | null {
  return emailConfigFrom(env())
}
