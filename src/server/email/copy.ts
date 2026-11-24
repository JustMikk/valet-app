// What each email says (ADR-027), as plain text and as simple HTML with the same words. Pure, so the
// wording is tested without Resend. Everything placed in the HTML is escaped.
import { formatMoney } from "@/lib/money/format"

export type EmailContent = { subject: string; text: string; html: string }

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c)

/** One paragraph: lines of text, or a link. */
type Block = string[] | { link: string; label: string }

function render(blocks: Block[]): Pick<EmailContent, "text" | "html"> {
  const text = blocks
    .map((block) => ("link" in block ? `${block.label}: ${block.link}` : block.join("\n")))
    .join("\n\n")
  const body = blocks
    .map((block) =>
      "link" in block
        ? `<p><a href="${escapeHtml(block.link)}">${escapeHtml(block.label)}</a></p>`
        : `<p>${block.map(escapeHtml).join("<br>")}</p>`,
    )
    .join("\n")
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5">\n${body}\n</body></html>`
  return { text: `${text}\n`, html }
}

export type InviteCopy = { adminFirst: string; tenant: string; link: string; email: string }

/** An email invite: the same words as the text invite (ADR-026), and the address to sign in with. */
export function inviteEmail(copy: InviteCopy): EmailContent {
  const invited = `${copy.adminFirst} at ${copy.tenant.trim()} invited you to join their valet crew`
  return {
    subject: invited,
    ...render([
      [`${invited}.`],
      { link: copy.link, label: "Get started" },
      [`Sign in with this email address: ${copy.email}`],
    ]),
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
  return {
    subject: `Invoice ${copy.number} from ${company}`,
    ...render([
      ["Hello,"],
      [`Attached is invoice ${copy.number} for ${copy.venue}, ${copy.period}.`],
      [`Total due: ${formatMoney(copy.totalCents)}`, `Due: ${copy.due}`],
      ["Reply to this email with any questions."],
      [company],
    ]),
  }
}
