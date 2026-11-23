// Who can be texted, how a text is recognised as a repeat, and where its link points. Pure, so the
// rules are tested without a database or Twilio.
import { createHash } from "node:crypto"

import { e164, isUsNumber, type E164 } from "@/lib/contact/contact"

import type { SmsCopy } from "./copy"

export type SmsKind = SmsCopy["kind"]
export type SkipReason = "not_configured" | "no_phone" | "not_us"

export type SmsTarget = { ok: true; to: E164; last4: string } | { ok: false; reason: SkipReason }

/** Whether this phone can be texted now, and if not, why (shown to admins, kept in the log). */
export function smsTarget(configured: boolean, phone: string | null | undefined): SmsTarget {
  if (!configured) return { ok: false, reason: "not_configured" }
  const to = phone ? e164(phone) : null
  if (!to) return { ok: false, reason: "no_phone" }
  if (!isUsNumber(to)) return { ok: false, reason: "not_us" }
  return { ok: true, to, last4: to.slice(-4) }
}

/**
 * Two texts are the same when the kind, the person and the words match: a double click sends once,
 * while two real changes in a row (two new times) each send. A hash, so the log holds no message.
 */
export function dedupeKey(kind: SmsKind, staffId: string, body: string): string {
  const digest = createHash("sha256").update(body).digest("hex").slice(0, 24)
  return `${kind}:${staffId}:${digest}`
}

/** Sign-in with the invited number already in the field (ADR-025). */
export function inviteLink(appUrl: string, to: E164): string {
  return `${appUrl}/login?role=staff&login=${encodeURIComponent(to)}`
}

/** A page of the staff app; the same paths the notification center links to. */
export function shiftLink(appUrl: string, path: string): string {
  return `${appUrl}/${path.replace(/^\/+/, "")}`
}
