// Resend's send-email API over REST, without the SDK (ADR-027), as the Twilio sender does. `sendEmail`
// never throws: network errors, timeouts and odd answers are failed results, and the caller decides
// whether a failure stops what it was doing (an invoice) or not (an invite).
// Checked against https://resend.com/docs/api-reference/emails/send-email.
import { z } from "zod/mini"

import type { EmailConfig } from "./config"

const API = "https://api.resend.com/emails"
/** Room for a PDF upload; an admin waiting on an invoice send waits no longer than this. */
export const SEND_BUDGET_MS = 15_000

export type Attachment = {
  filename: string
  /** Base64. */
  content: string
  /** Shown inline where the HTML has `<img src="cid:…">`, not as a file. */
  contentId?: string
}

export type Email = {
  to: string[]
  cc?: string[]
  subject: string
  text: string
  html: string
  attachments?: Attachment[]
  /** Resend sends once per key within 24 hours: a repeated request returns the first email. */
  idempotencyKey?: string
}

export type SendResult =
  { ok: true; id: string } | { ok: false; status: number | null; message: string }

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export function sendRequest(cfg: EmailConfig, email: Email) {
  const headers: Record<string, string> = {
    authorization: `Bearer ${cfg.apiKey}`,
    "content-type": "application/json",
    // Resend refuses a request without one.
    "user-agent": "valet-workforce/1.0",
  }
  if (email.idempotencyKey) headers["idempotency-key"] = email.idempotencyKey
  const body = {
    from: cfg.from,
    to: email.to,
    ...(email.cc?.length ? { cc: email.cc } : {}),
    ...(cfg.replyTo ? { reply_to: cfg.replyTo } : {}),
    subject: email.subject,
    text: email.text,
    html: email.html,
    ...(email.attachments?.length
      ? {
          attachments: email.attachments.map(({ filename, content, contentId }) => ({
            filename,
            content,
            ...(contentId ? { content_id: contentId } : {}),
          })),
        }
      : {}),
  }
  return { url: API, headers, body: JSON.stringify(body) }
}

const Created = z.object({ id: z.string() })
const Failure = z.object({ message: z.optional(z.nullable(z.string())) })

/** Resend's answer to a send: the email's id, or the error it gave. */
export function parseSendResponse(httpStatus: number, json: unknown): SendResult {
  if (httpStatus >= 200 && httpStatus < 300) {
    const created = Created.safeParse(json)
    return created.success
      ? { ok: true, id: created.data.id }
      : { ok: false, status: httpStatus, message: `Resend responded ${httpStatus} without an id` }
  }
  const error = Failure.safeParse(json)
  const message = (error.success ? error.data.message : null) ?? `Resend responded ${httpStatus}`
  return { ok: false, status: httpStatus, message }
}

/** Sends one email. Never throws. */
export async function sendEmail(
  cfg: EmailConfig,
  email: Email,
  fetcher: Fetcher = fetch,
): Promise<SendResult> {
  try {
    const request = sendRequest(cfg, email)
    const response = await fetcher(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(SEND_BUDGET_MS),
    })
    const json: unknown = await response.json().catch(() => null)
    return parseSendResponse(response.status, json)
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : "Send failed",
    }
  }
}
