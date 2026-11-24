// Emailing an invoice (ADR-027): to the venue's client, copying its manager, accountant and others,
// with the PDF the admin's browser built (the same file Download saves). The list is saved on the
// venue for its next invoice. A draft is marked sent only once the email went; a sent invoice can be
// emailed again. With email off, Send marks a draft sent and emails nobody, as before.
import type {
  InvoiceDetail,
  InvoiceRecipients,
  SendInvoiceRequest,
  SendInvoiceResult,
} from "@/lib/data/admin/ops-schemas"
import { formatDate, formatTime, wallTime } from "@/lib/time/labels"

import { rows, sql } from "../db/client"
import { emailConfig, emailInvoice } from "../email"
import { ApiError, badRequest, conflict, notFound } from "../http/handler"
import { adminCtx } from "./common"
import { periodLabel } from "./invoice-store"

const DAY = 24 * 60 * 60_000
const PAYMENT_TERMS_DAYS = 14

const tidy = (email: string) => email.trim().toLowerCase()

/**
 * Trimmed and lowercased, blanks and repeats dropped, and who is copied (`cc`): the manager, the
 * accountant and the others, never the client twice.
 */
export function cleanRecipients(input: InvoiceRecipients): InvoiceRecipients & { cc: string[] } {
  const client = tidy(input.client)
  const manager = tidy(input.manager)
  const accountant = tidy(input.accountant)
  const taken = new Set([client, manager, accountant])
  const others: string[] = []
  for (const email of input.others.map(tidy)) {
    if (!email || taken.has(email)) continue
    taken.add(email)
    others.push(email)
  }
  const cc = [...new Set([manager, accountant, ...others])].filter((e) => e && e !== client)
  return { client, manager, accountant, others, cc }
}

/** "Dec 9, 2026" */
export function dueText(due: Date, tz: string): string {
  return `${formatDate(due, tz).split(" ").slice(1).join(" ")}, ${wallTime(due, tz).year}`
}

/** "Nov 1 – 15, 2026", or for an event's invoice "Holiday Gala, Oct 17, 2026". */
export function periodText(row: {
  period_start: string
  period_end: string
  event_id: string | null
  label: string | null
}): string {
  const year = row.period_end.slice(0, 4)
  if (row.event_id && row.label) return `${row.label.replace(/ · (?=[^·]*$)/, ", ")}, ${year}`
  return `${periodLabel(row.period_start, row.period_end)}, ${year}`
}

/** What the invoice screen needs to email it: who to, when it went before, and what is possible. */
export async function invoiceEmailFacts(invoice: {
  id: string
  venue_id: string
  tz: string
  status: string
}): Promise<Pick<InvoiceDetail, "recipients" | "sends" | "emailReady" | "canResend">> {
  const [venue] = await rows<{
    billing_email: string
    manager_email: string
    accountant_email: string
    cc_emails: string[]
  }>(
    sql()`select billing_email, manager_email, accountant_email, cc_emails from venues
          where id = ${invoice.venue_id}`,
  )
  const sends = await rows<{ sent_at: Date; to_email: string; cc_emails: string[] }>(
    sql()`select sent_at, to_email, cc_emails from invoice_sends
          where invoice_id = ${invoice.id} order by sent_at desc`,
  )
  const ready = emailConfig() !== null
  return {
    recipients: {
      client: venue?.billing_email ?? "",
      manager: venue?.manager_email ?? "",
      accountant: venue?.accountant_email ?? "",
      others: venue?.cc_emails ?? [],
    },
    sends: sends.map((send) => ({
      atLabel: `${formatDate(send.sent_at, invoice.tz).split(" ").slice(1).join(" ")}, ${formatTime(send.sent_at, invoice.tz)}`,
      to: send.to_email,
      cc: send.cc_emails,
    })),
    emailReady: ready,
    canResend: ready && invoice.status === "sent",
  }
}

type SendRow = {
  number: string
  status: "draft" | "sent" | "paid"
  venue_id: string
  venue: string
  tz: string
  period_start: string
  period_end: string
  event_id: string | null
  label: string | null
  due_at: Date | null
  total_cents: number
  tax_cents: number
  company: string
}

/** Send a draft (locked from here on, due in fourteen days), or email a sent one again. */
export async function sendInvoice(
  adminId: string,
  id: string,
  request: SendInvoiceRequest,
  now: Date,
): Promise<SendInvoiceResult> {
  const ctx = await adminCtx(adminId)
  const [invoice] = await rows<SendRow>(
    sql()`select i.number, i.status, v.id as venue_id, v.name as venue, v.timezone as tz,
            i.period_start::text, i.period_end::text, i.event_id, i.label, i.due_at,
            i.total_cents, i.tax_cents, t.name as company
          from invoices i join venues v on v.id = i.venue_id join tenants t on t.id = i.tenant_id
          where i.id = ${id} and i.tenant_id = ${ctx.tenantId}`,
  )
  if (!invoice) throw notFound("Invoice not found.")
  const cfg = emailConfig()
  if (invoice.status === "paid") throw conflict("paid", "That invoice is already paid.")
  if (invoice.status === "sent" && !cfg) {
    throw conflict("already_sent", "That invoice was already sent.")
  }
  if (Buffer.from(request.pdf.slice(0, 8), "base64").toString("latin1").slice(0, 5) !== "%PDF-") {
    throw badRequest("That file isn't the invoice PDF.", "bad_pdf")
  }

  const list = cleanRecipients(request.recipients)
  await sql()`update venues set billing_email = ${list.client}, manager_email = ${list.manager},
                accountant_email = ${list.accountant}, cc_emails = ${list.others}::text[]
              where id = ${invoice.venue_id}`

  const dueAt = invoice.due_at ?? new Date(now.getTime() + PAYMENT_TERMS_DAYS * DAY)
  let emailId: string | null = null
  if (cfg) {
    const result = await emailInvoice(cfg, {
      company: invoice.company,
      number: invoice.number,
      venue: invoice.venue,
      period: periodText(invoice),
      totalCents: invoice.total_cents + invoice.tax_cents,
      due: dueText(dueAt, invoice.tz),
      to: list.client,
      cc: list.cc,
      pdf: request.pdf,
    })
    if (!result.ok) {
      console.warn("Invoice email failed", result.status, result.message)
      const reason = result.message.replace(/\.+$/, "")
      const still = invoice.status === "draft" ? " The invoice is still a draft." : ""
      throw new ApiError(502, "email_failed", `The email didn't go through: ${reason}.${still}`)
    }
    emailId = result.id
  }

  await sql()`update invoices set billed_to = ${list.client},
                status = 'sent', sent_at = coalesce(sent_at, ${now.toISOString()}),
                due_at = ${dueAt.toISOString()}
              where id = ${id}`
  if (emailId) {
    await sql()`insert into invoice_sends (invoice_id, sent_by, to_email, cc_emails, email_id)
                values (${id}, ${adminId}, ${list.client}, ${list.cc}::text[], ${emailId})`
  }
  return { billedTo: list.client, emailed: emailId !== null }
}
