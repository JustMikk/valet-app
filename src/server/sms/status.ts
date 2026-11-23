// Twilio's status callbacks (POST /api/sms/status): each text's progress to delivered, undelivered
// or failed. Only requests signed with our Auth Token for our exact StatusCallback URL are trusted;
// the URL comes from APP_URL, never from the request, so a proxy cannot change what is verified.
// Callbacks can arrive out of order, so a final status is never overwritten by an earlier one.
import { sql } from "../db/client"
import type { SmsConfig } from "./config"
import { OPTED_OUT, validSignature } from "./twilio"

const FINAL = new Set(["delivered", "undelivered", "failed", "canceled", "opted_out"])

export function callbackIsFromTwilio(
  cfg: SmsConfig | null,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  return cfg !== null && validSignature(cfg.authToken, cfg.statusUrl, params, signature)
}

export type StatusUpdate = { sid: string; status: string; errorCode: number | null; final: boolean }

export function statusUpdate(params: Record<string, string | undefined>): StatusUpdate | null {
  const sid = params.MessageSid?.trim()
  const reported = params.MessageStatus?.trim()
  if (!sid || !reported) return null
  const code = Number(params.ErrorCode)
  const errorCode = params.ErrorCode && Number.isInteger(code) ? code : null
  const status = errorCode === OPTED_OUT ? "opted_out" : reported
  return { sid, status, errorCode, final: FINAL.has(status) }
}

/** Applies one callback. A non-final status only moves a text that is not already final. */
export async function applyStatus(update: StatusUpdate): Promise<void> {
  if (update.final) {
    await sql()`update sms_messages
                set status = ${update.status}, error_code = ${update.errorCode}, updated_at = now()
                where twilio_sid = ${update.sid}`
    return
  }
  await sql()`update sms_messages set status = ${update.status}, updated_at = now()
              where twilio_sid = ${update.sid} and status <> all(${[...FINAL]}::text[])`
}
