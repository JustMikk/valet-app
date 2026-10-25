// What an event's invoice should say, decided from the event and its crew's hours. Pure: the
// database work around it is in event-invoice.ts.
import { amountCents } from "@/lib/money/format"
import { formatDate, formatRange, formatTime } from "@/lib/time/labels"

import type { InvoiceLineInput } from "./invoice-store"

const MIN = 60_000

export type InvoiceEvent = {
  title: string
  kind: string
  starts_at: Date
  ends_at: Date
  crew_size: number
  status: "draft" | "published" | "cancelled"
  tz: string
  bill_rate_cents: number
}

/** One held slot of the event (open slots have no one to bill). */
export type CrewHours = {
  name: string
  hours_status: "in_review" | "approved"
  clocked_in_at: Date | null
  clocked_out_at: Date | null
}

export type EventInvoicePlan = {
  /** "Wedding · Nov 8": the invoice's name in the list. */
  label: string
  /** The line under the venue name: what, when, and how many of the requested crew worked. */
  summary: string
  lines: InvoiceLineInput[]
}

/**
 * The invoice for an event, or null while it is not ready to bill: the event has to be over, and
 * no one who clocked in can still be waiting for their hours to be approved (so nothing is
 * invoiced by accident, spec §10.1). People who never clocked in have no hours and add no line.
 * Billable time is each worker's approved clock-in to clock-out, the only source of hours (§10.2).
 */
export function planEventInvoice(
  event: InvoiceEvent,
  crew: CrewHours[],
  now: Date,
): EventInvoicePlan | null {
  if (event.status !== "published" || event.ends_at > now) return null
  if (crew.some((slot) => slot.clocked_in_at && slot.hours_status === "in_review")) return null

  const lines: InvoiceLineInput[] = []
  for (const slot of [...crew].sort((a, b) => a.name.localeCompare(b.name))) {
    if (slot.hours_status !== "approved" || !slot.clocked_in_at || !slot.clocked_out_at) continue
    const minutes = Math.round((slot.clocked_out_at.getTime() - slot.clocked_in_at.getTime()) / MIN)
    lines.push({
      what: slot.name,
      detail: `${formatTime(slot.clocked_in_at, event.tz)} – ${formatTime(slot.clocked_out_at, event.tz)}`,
      staff_count: 1,
      minutes,
      rate_cents: event.bill_rate_cents,
      amount_cents: amountCents(minutes, event.bill_rate_cents),
    })
  }
  if (lines.length === 0) return null

  const name = event.kind || event.title
  const date = formatDate(event.starts_at, event.tz)
  return {
    label: `${name} · ${date.split(" ").slice(1).join(" ")}`,
    summary: `${name} · ${date} · ${formatRange(event.starts_at, event.ends_at, event.tz)} · ${lines.length} of ${event.crew_size} staff`,
    lines,
  }
}
