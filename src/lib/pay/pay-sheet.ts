// The event pay sheet (ADR-022), shared by the server and the static build's mock: what each valet
// is owed for one event at the event's rate, and what is paid or still pending.
import { amountCents, formatHoursDecimal, formatMoney, formatRate } from "@/lib/money/format"

export type PayState = "on_shift" | "in_review" | "pending" | "paid"

export type PayInput = {
  assignmentId: string
  staffId: string
  name: string
  clockedInAt: Date | null
  clockedOutAt: Date | null
  /** Hours approved on the Hours screen; only approved hours can be marked paid. */
  approved: boolean
  /** Set once paid: the amount paid, which a later rate change does not move. */
  paidCents: number | null
  tips: boolean
}

export type PayRow = {
  assignmentId: string
  staffId: string
  name: string
  minutes: number
  amountCents: number
  balanceCents: number
  state: PayState
  tips: boolean
}

export type PayTotals = {
  valets: number
  minutes: number
  amountCents: number
  paidCents: number
  pendingCents: number
}

const MINUTE = 60_000

function payRow(input: PayInput, rateCents: number): PayRow {
  const base = {
    assignmentId: input.assignmentId,
    staffId: input.staffId,
    name: input.name,
    tips: input.tips,
  }
  if (!input.clockedInAt || !input.clockedOutAt) {
    return { ...base, minutes: 0, amountCents: 0, balanceCents: 0, state: "on_shift" }
  }
  const minutes = Math.max(
    0,
    Math.round((input.clockedOutAt.getTime() - input.clockedInAt.getTime()) / MINUTE),
  )
  if (input.paidCents !== null) {
    return { ...base, minutes, amountCents: input.paidCents, balanceCents: 0, state: "paid" }
  }
  const owed = amountCents(minutes, rateCents)
  return {
    ...base,
    minutes,
    amountCents: owed,
    balanceCents: owed,
    state: input.approved ? "pending" : "in_review",
  }
}

/** One row per valet who clocked in, by name, and the sheet's totals. */
export function paySheet(
  inputs: PayInput[],
  rateCents: number,
): { rows: PayRow[]; totals: PayTotals } {
  const rows = inputs
    .filter((input) => input.clockedInAt !== null)
    .map((input) => payRow(input, rateCents))
    .sort((a, b) => a.name.localeCompare(b.name))
  const sum = (pick: (row: PayRow) => number) => rows.reduce((total, row) => total + pick(row), 0)
  return {
    rows,
    totals: {
      valets: rows.length,
      minutes: sum((row) => row.minutes),
      amountCents: sum((row) => row.amountCents),
      paidCents: sum((row) => (row.state === "paid" ? row.amountCents : 0)),
      pendingCents: sum((row) => row.balanceCents),
    },
  }
}

/** Sales tax on an invoice subtotal; the rate is in basis points (625 is 6.25 %). */
export const taxCents = (subtotalCents: number, rateBp: number) =>
  Math.round((subtotalCents * rateBp) / 10_000)

/** 625 → "6.25%", 800 → "8%". */
export const formatTaxRate = (rateBp: number) => `${Number((rateBp / 100).toFixed(2))}%`

/** Where an event's pay stands, worst first: hours to review, then pay owed, then still on shift. */
export function eventPayState(rows: PayRow[]): PayState {
  for (const state of ["in_review", "pending", "on_shift"] as const) {
    if (rows.some((row) => row.state === state)) return state
  }
  return "paid"
}

type PayStubEvent = {
  venue: string
  name: string
  date: string
  start: string
  end: string
  rateCents: number
}

const PAID_LINE: Record<PayState, string> = {
  paid: "Paid: Yes",
  pending: "Paid: No",
  in_review: "Paid: No (hours in review)",
  on_shift: "Paid: No (still on shift)",
}

/** One valet's pay for one event, as the inbox message their pay stub arrives in. */
export function payStubText(event: PayStubEvent, row: PayRow): string {
  return [
    `Pay stub · ${event.venue} · ${event.name}`,
    `${event.date} · ${event.start} – ${event.end}`,
    `Hours: ${formatHoursDecimal(row.minutes)} × ${formatRate(event.rateCents)} = ${formatMoney(row.amountCents)}`,
    `${PAID_LINE[row.state]} · Tips: ${row.tips ? "Yes" : "No"}`,
    `Balance: ${formatMoney(row.balanceCents)}`,
  ].join("\n")
}
