// Seeded invoices (snapshots: lines are stored, not recomputed). Half-month periods relative to
// today, with the design's mix: two drafts, one sent and overdue, one paid, one sent.
import { randomUUID } from "node:crypto"

import { formatDate, zonedInstant } from "@/lib/time/labels"

import { TENANT_ID, TZ, VENUES, type VenueKey } from "./cast"

const DAY = 24 * 60 * 60_000
type Wall = { year: number; month: number; day: number }

/** [start, end] dates of the half-month containing `offsetHalves` halves before today's. */
function halfMonth(today: Wall, back: number): { start: string; end: string; mid: Date } {
  let { year, month } = today
  let second = today.day >= 16
  for (let i = 0; i < back; i++) {
    if (second) second = false
    else {
      second = true
      month -= 1
      if (month === 0) {
        month = 12
        year -= 1
      }
    }
  }
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const startDay = second ? 16 : 1
  const endDay = second ? last : 15
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    start: `${year}-${pad(month)}-${pad(startDay)}`,
    end: `${year}-${pad(month)}-${pad(endDay)}`,
    mid: zonedInstant(TZ, { year, month, day: startDay + 4, hour: 12, minute: 0 }),
  }
}

type LineSpec = { what: string; staff: number; hours: number }

export function buildInvoices(now: Date, today: Wall, venueIds: Record<VenueKey, string>) {
  const current = halfMonth(today, 0)
  const previous = halfMonth(today, 1)
  const dateOf = (period: ReturnType<typeof halfMonth>, offset: number) =>
    formatDate(new Date(period.mid.getTime() + offset * DAY), TZ)
      .split(" ")
      .slice(1)
      .join(" ")

  const invoices: Record<string, unknown>[] = []
  const invoiceLines: Record<string, unknown>[] = []
  let position = 0

  const add = (
    venue: VenueKey,
    period: ReturnType<typeof halfMonth>,
    number: number,
    status: "draft" | "sent" | "paid",
    lines: LineSpec[],
    extra: Record<string, unknown> = {},
  ) => {
    const rate = VENUES[venue].rateCents
    const id = randomUUID()
    const minutes = lines.reduce((sum, line) => sum + line.hours * 60, 0)
    const total = lines.reduce((sum, line) => sum + Math.round(line.hours * rate), 0)
    invoices.push({
      id,
      tenant_id: TENANT_ID,
      venue_id: venueIds[venue],
      number: `INV-${today.year}-${String(number).padStart(4, "0")}`,
      period_start: period.start,
      period_end: period.end,
      status,
      billed_to: VENUES[venue].billing,
      total_cents: total,
      minutes,
      ...extra,
    })
    for (const line of lines) {
      invoiceLines.push({
        id: randomUUID(),
        invoice_id: id,
        position: position++,
        what: line.what,
        staff_count: line.staff,
        minutes: line.hours * 60,
        rate_cents: rate,
        amount_cents: Math.round(line.hours * rate),
      })
    }
  }
  const iso = (ms: number) => new Date(ms).toISOString()

  add("harbor", current, 142, "draft", [
    { what: `Wedding · ${dateOf(current, 3)}`, staff: 8, hours: 58.5 },
    { what: `Sunday brunch · ${dateOf(current, -2)}`, staff: 5, hours: 24.5 },
    { what: `Corporate lunch · ${dateOf(current, 0)}`, staff: 7, hours: 56 },
  ])
  add("grand", current, 143, "draft", [
    { what: `Corporate dinner · ${dateOf(current, 1)}`, staff: 6, hours: 36 },
    { what: `Board dinner · ${dateOf(current, 2)}`, staff: 4, hours: 38.5 },
    { what: `Reception · ${dateOf(current, -1)}`, staff: 5, hours: 22 },
  ])
  add(
    "maison",
    previous,
    140,
    "sent",
    [
      { what: `Dinner service · ${dateOf(previous, 0)}`, staff: 5, hours: 30 },
      { what: `Gala · ${dateOf(previous, 3)}`, staff: 7, hours: 42 },
    ],
    { sent_at: iso(now.getTime() - 20 * DAY), due_at: iso(now.getTime() - 6 * DAY) },
  )
  add(
    "grand",
    previous,
    139,
    "paid",
    [
      { what: `Corporate dinner · ${dateOf(previous, 0)}`, staff: 8, hours: 66 },
      { what: `Board dinner · ${dateOf(previous, 4)}`, staff: 6, hours: 60.5 },
    ],
    {
      sent_at: iso(now.getTime() - 24 * DAY),
      due_at: iso(now.getTime() - 10 * DAY),
      paid_at: iso(now.getTime() - 12 * DAY),
    },
  )
  add(
    "osteria",
    previous,
    141,
    "sent",
    [{ what: `Dinner service · ${dateOf(previous, 1)}`, staff: 4, hours: 40 }],
    { sent_at: iso(now.getTime() - 9 * DAY), due_at: iso(now.getTime() + 5 * DAY) },
  )

  return { invoices, invoiceLines }
}
