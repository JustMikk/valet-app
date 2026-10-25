// Invoices drafted by the system (product spec §10.3: one per event, built from approved hours).
// Approving the last of an event's hours drafts it; sending stays the dispatcher's decision, since
// that is the step that emails the venue and locks the hours. A draft follows its event: it is
// rebuilt if the crew's hours change and withdrawn if the event is no longer ready to bill.
import { formatMoney } from "@/lib/money/format"

import { rows, sql } from "../db/client"
import { notifyAdmins } from "../notify"
import { planEventInvoice, type CrewHours, type InvoiceEvent } from "./event-invoice-plan"
import { nextInvoiceNumber, totalsOf, writeLines } from "./invoice-store"

const DAY = 24 * 60 * 60_000
const SWEEP_DAYS = 60
const SWEEP_LIMIT = 25

type EventRow = InvoiceEvent & {
  id: string
  tenant_id: string
  venue_id: string
  venue: string
  billing_email: string
}

/** Drafts, refreshes or withdraws the invoice of one event. Safe to call as often as hours change. */
export async function syncEventInvoice(
  eventId: string,
  now: Date,
  options: { notify: boolean } = { notify: true },
): Promise<void> {
  const [event] = await rows<EventRow>(
    sql()`select e.id, e.tenant_id, e.venue_id, e.title, e.kind, e.starts_at, e.ends_at, e.crew_size,
                 e.status, v.name as venue, v.timezone as tz, v.bill_rate_cents, v.billing_email
          from events e join venues v on v.id = e.venue_id where e.id = ${eventId}`,
  )
  if (!event) return
  const [existing] = await rows<{ id: string; status: string }>(
    sql()`select id, status from invoices where event_id = ${eventId}`,
  )
  // Sent means locked: the hours behind it can no longer move it.
  if (existing && existing.status !== "draft") return
  if (!existing) {
    // A period invoice built by hand already billed this event.
    const [covered] = await rows<{ invoice_id: string }>(
      sql()`select invoice_id from invoice_events where event_id = ${eventId}`,
    )
    if (covered) return
  }

  const crew = await rows<CrewHours>(
    sql()`select s.name, a.hours_status, a.clocked_in_at, a.clocked_out_at
          from assignments a join staff s on s.id = a.staff_id where a.event_id = ${eventId}`,
  )
  const plan = planEventInvoice(event, crew, now)
  if (!plan) {
    if (existing) await sql()`delete from invoices where id = ${existing.id} and status = 'draft'`
    return
  }

  const { total, minutes } = totalsOf(plan.lines)
  if (existing) {
    await sql()`update invoices set total_cents = ${total}, minutes = ${minutes},
                       label = ${plan.label}, summary = ${plan.summary}, billed_to = ${event.billing_email}
                where id = ${existing.id}`
    await writeLines(existing.id, plan.lines)
    return
  }

  const number = await nextInvoiceNumber(event.tenant_id, now)
  const [created] = await rows<{ id: string }>(
    sql()`insert into invoices (tenant_id, venue_id, event_id, number, period_start, period_end, status,
                                billed_to, total_cents, minutes, label, summary)
          values (${event.tenant_id}, ${event.venue_id}, ${eventId}, ${number},
                  (${event.starts_at.toISOString()}::timestamptz at time zone ${event.tz})::date,
                  (${event.starts_at.toISOString()}::timestamptz at time zone ${event.tz})::date,
                  'draft', ${event.billing_email}, ${total}, ${minutes}, ${plan.label}, ${plan.summary})
          on conflict (event_id) where event_id is not null do nothing
          returning id`,
  )
  // Someone else drafted it a moment ago: theirs stands.
  if (!created) return
  await writeLines(created.id, plan.lines)
  if (options.notify) {
    await notifyAdmins(event.tenant_id, {
      dedupeKey: `invoice:${eventId}`,
      icon: "receipt_long",
      tone: "info",
      title: `Invoice drafted · ${event.venue}`,
      body: `${plan.label} · ${formatMoney(total)}. Review and send.`,
      href: `/admin/invoices/detail?id=${created.id}`,
    })
  }
}

/** After an approval: bring the invoices of the events it touched up to date. Never fails the approval. */
export async function syncEventInvoices(eventIds: string[], now: Date): Promise<void> {
  for (const eventId of new Set(eventIds)) {
    try {
      await syncEventInvoice(eventId, now)
    } catch (error) {
      console.warn("Invoice draft skipped", eventId, error)
    }
  }
}

/**
 * Catches up on events whose hours were approved before invoices were drafted automatically, or
 * while something failed. Quiet: these are not news, they are what the list should have shown.
 */
export async function syncRecentInvoices(tenantId: string, now: Date): Promise<void> {
  const due = await rows<{ id: string }>(
    sql()`select e.id from events e
          where e.tenant_id = ${tenantId} and e.status = 'published'
            and e.ends_at < ${now.toISOString()} and e.ends_at > ${new Date(now.getTime() - SWEEP_DAYS * DAY).toISOString()}
            and not exists (select 1 from invoices i where i.event_id = e.id)
            and not exists (select 1 from invoice_events ie where ie.event_id = e.id)
            and exists (select 1 from assignments a where a.event_id = e.id
                          and a.hours_status = 'approved' and a.clocked_out_at is not null)
          order by e.ends_at desc limit ${SWEEP_LIMIT}`,
  )
  for (const { id } of due) {
    try {
      await syncEventInvoice(id, now, { notify: false })
    } catch (error) {
      console.warn("Invoice catch-up skipped", id, error)
    }
  }
}
