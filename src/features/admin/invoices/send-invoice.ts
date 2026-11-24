// Emailing an invoice from its page (ADR-027): checking the list, and building the request with the
// same PDF Download saves.
import {
  EmailAddress,
  type InvoiceDetail,
  type InvoiceRecipients,
  type SendInvoiceRequest,
} from "@/lib/data"
import { toBase64 } from "@/lib/pdf/base64"
import { loadBannerLogo } from "@/lib/pdf/banner-logo"

import { invoicePdf } from "./invoice-pdf"

/** Under a field that holds something other than an email address; blank is fine. */
export const emailError = (value: string): string | undefined =>
  value.trim() && !EmailAddress.safeParse(value.trim()).success
    ? "Enter a full email address"
    : undefined

/** What stops Send, in the button's words, or null when the list can be sent. */
export function recipientsProblem(list: InvoiceRecipients): string | null {
  if (!list.client.trim()) return "Add the client's email"
  const all = [list.client, list.manager, list.accountant, ...list.others]
  return all.some((email) => emailError(email)) ? "Check the emails" : null
}

const tidy = (email: string) => email.trim().toLowerCase()

/** The list as sent: trimmed, lowercased, empty extra fields left out. */
export function tidyRecipients(list: InvoiceRecipients): InvoiceRecipients {
  return {
    client: tidy(list.client),
    manager: tidy(list.manager),
    accountant: tidy(list.accountant),
    others: list.others.map(tidy).filter(Boolean),
  }
}

/** The request: the list, and the PDF as it reads once sent (billed to the client, no notice). */
export async function sendRequestFor(
  invoice: InvoiceDetail,
  company: string,
  list: InvoiceRecipients,
): Promise<SendInvoiceRequest> {
  const recipients = tidyRecipients(list)
  const pdf = invoicePdf(
    { ...invoice, notice: null, billedTo: recipients.client },
    company,
    await loadBannerLogo(),
  )
  return { recipients, pdf: toBase64(pdf) }
}
