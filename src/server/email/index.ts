// The app's emails (ADR-027): an invite with the sign-in link, and an invoice with its PDF. Off, and
// skipped without failing, until Resend is configured.
import { emailConfig, type EmailConfig } from "./config"
import { invoiceEmail, inviteEmail, type InvoiceCopy } from "./copy"
import { sendEmail, type SendResult } from "./resend"

export { emailConfig, type EmailConfig } from "./config"

export type InviteEmail = { staffId: string; to: string; adminFirst: string; tenantName: string }
export type InviteEmailResult =
  { emailed: true } | { emailed: false; reason: "not_configured" | "failed" }

/** Sign-in with the invited address already in the field (ADR-025). */
export function inviteLink(appUrl: string, email: string): string {
  return `${appUrl}/login?role=staff&login=${encodeURIComponent(email)}`
}

/** Emails a person invited by email the link to join. Says whether it went; never throws. */
export async function emailInvite(invite: InviteEmail): Promise<InviteEmailResult> {
  const cfg = emailConfig()
  if (!cfg) return { emailed: false, reason: "not_configured" }
  const content = inviteEmail({
    adminFirst: invite.adminFirst,
    tenant: invite.tenantName,
    link: inviteLink(cfg.appUrl, invite.to),
    email: invite.to,
  })
  // One invite email per person, however often the request is repeated.
  const result = await sendEmail(cfg, {
    to: [invite.to],
    ...content,
    idempotencyKey: `invite/${invite.staffId}`,
  })
  if (result.ok) return { emailed: true }
  console.warn("Invite email failed", result.status, result.message)
  return { emailed: false, reason: "failed" }
}

export type InvoiceEmail = InvoiceCopy & {
  to: string
  cc: string[]
  /** The PDF, base64. */
  pdf: string
}

/** Emails an invoice to the client, copying the others, with its PDF attached. */
export function emailInvoice(cfg: EmailConfig, invoice: InvoiceEmail): Promise<SendResult> {
  return sendEmail(cfg, {
    to: [invoice.to],
    cc: invoice.cc,
    ...invoiceEmail(invoice),
    attachments: [{ filename: `${invoice.number}.pdf`, content: invoice.pdf }],
  })
}
