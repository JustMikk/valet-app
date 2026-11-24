// What each email says (ADR-027), as plain text and as branded HTML with the same words. Pure, so the
// wording is tested without Resend. Everything placed in the HTML is escaped (layout.ts).
import { formatMoney } from "@/lib/money/format"

import { button, frame, heading, join, paragraph, smallLink, strong, summary } from "./layout"

export { escapeHtml } from "./layout"

export type EmailContent = { subject: string; text: string; html: string }

/** Paragraphs of lines, as the plain-text part. */
const plain = (paragraphs: string[][]) => `${paragraphs.map((p) => p.join("\n")).join("\n\n")}\n`

export type InviteCopy = { adminFirst: string; tenant: string; link: string; email: string }

/** An email invite: the same words as the text invite (ADR-026), and the address to sign in with. */
export function inviteEmail(copy: InviteCopy): EmailContent {
  const tenant = copy.tenant.trim()
  const invited = `${copy.adminFirst} at ${tenant} invited you to join their valet crew`
  const signIn = "Sign in with this email address: "
  return {
    subject: invited,
    text: plain([[`${invited}.`], [`Get started: ${copy.link}`], [`${signIn}${copy.email}`]]),
    html: frame({
      title: invited,
      preheader: `${signIn}${copy.email}`,
      body: [
        heading(`${invited}.`),
        button("Get started", copy.link),
        paragraph(join(signIn, strong(copy.email))),
        smallLink(copy.link),
      ],
      footer: tenant,
    }),
  }
}

export type InvoiceCopy = {
  company: string
  /** "INV-2026-0142" */
  number: string
  venue: string
  /** "Nov 1 – 15, 2026", or the event and its date. */
  period: string
  totalCents: number
  /** "Dec 9, 2026" */
  due: string
}

/** An invoice email (owner's wording, D47): a short summary; the PDF carries the lines. */
export function invoiceEmail(copy: InvoiceCopy): EmailContent {
  const company = copy.company.trim()
  const subject = `Invoice ${copy.number} from ${company}`
  const total = formatMoney(copy.totalCents)
  const attached = `Attached is invoice ${copy.number} for ${copy.venue}, ${copy.period}.`
  const reply = "Reply to this email with any questions."
  return {
    subject,
    text: plain([
      ["Hello,"],
      [attached],
      [`Total due: ${total}`, `Due: ${copy.due}`],
      [reply],
      [company],
    ]),
    html: frame({
      title: subject,
      preheader: `Total due: ${total} · Due: ${copy.due}`,
      banner: { label: "Invoice", value: copy.number },
      body: [
        paragraph("Hello,"),
        paragraph(attached),
        summary([
          { label: "Total due", value: total },
          { label: "Due", value: copy.due },
        ]),
        paragraph(reply),
        paragraph(strong(company)),
      ],
      footer: `${company} · Invoice ${copy.number}`,
    }),
  }
}
