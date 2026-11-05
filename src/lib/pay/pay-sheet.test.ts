import { describe, expect, it } from "vitest"

import { formatTaxRate, paySheet, taxCents, type PayInput } from "./pay-sheet"

const shift = (over: Partial<PayInput> = {}): PayInput => ({
  assignmentId: "a1",
  staffId: "s1",
  name: "Sebah Idris",
  clockedInAt: new Date("2026-09-15T13:00:00Z"),
  // 7.5 hours later, as on the client's sheet (8:00 AM – 3:30 PM).
  clockedOutAt: new Date("2026-09-15T20:30:00Z"),
  approved: true,
  paidCents: null,
  tips: false,
  ...over,
})

describe("paySheet", () => {
  it("owes approved hours at the event's rate until they are paid", () => {
    const { rows } = paySheet([shift()], 2100)
    expect(rows).toEqual([
      {
        assignmentId: "a1",
        staffId: "s1",
        name: "Sebah Idris",
        minutes: 450,
        amountCents: 15_750,
        balanceCents: 15_750,
        state: "pending",
        tips: false,
      },
    ])
  })

  it("keeps a paid shift at what was paid, with nothing left owing", () => {
    const [row] = paySheet([shift({ paidCents: 15_000, tips: true })], 2400).rows
    expect(row).toMatchObject({ amountCents: 15_000, balanceCents: 0, state: "paid", tips: true })
  })

  it("marks hours not yet approved as in review, still owed", () => {
    const [row] = paySheet([shift({ approved: false })], 2100).rows
    expect(row).toMatchObject({ state: "in_review", amountCents: 15_750, balanceCents: 15_750 })
  })

  it("shows someone still on the clock with no hours yet", () => {
    const [row] = paySheet([shift({ clockedOutAt: null })], 2100).rows
    expect(row).toMatchObject({ state: "on_shift", minutes: 0, amountCents: 0, balanceCents: 0 })
  })

  it("leaves out crew who never clocked in and sorts the rest by name", () => {
    const { rows } = paySheet(
      [
        shift({ assignmentId: "a2", name: "Kibrom Alemu" }),
        shift({ assignmentId: "a3", name: "No Show", clockedInAt: null, clockedOutAt: null }),
        shift({ assignmentId: "a1", name: "Ali Agareh" }),
      ],
      2100,
    )
    expect(rows.map((row) => row.name)).toEqual(["Ali Agareh", "Kibrom Alemu"])
  })

  it("totals valets, hours, pay, paid and pending", () => {
    const { totals } = paySheet(
      [
        shift({ assignmentId: "a1", name: "A", paidCents: 15_750 }),
        shift({ assignmentId: "a2", name: "B" }),
        shift({ assignmentId: "a3", name: "C", approved: false }),
      ],
      2100,
    )
    expect(totals).toEqual({
      valets: 3,
      minutes: 1350,
      amountCents: 47_250,
      paidCents: 15_750,
      pendingCents: 31_500,
    })
  })
})

describe("taxCents", () => {
  it("adds 6.25 % to the client's sheet total, rounded to the cent", () => {
    expect(taxCents(409_500, 625)).toBe(25_594)
  })

  it("is nothing at a zero rate", () => {
    expect(taxCents(409_500, 0)).toBe(0)
  })
})

describe("formatTaxRate", () => {
  it("words basis points as a percentage without trailing zeros", () => {
    expect(formatTaxRate(625)).toBe("6.25%")
    expect(formatTaxRate(800)).toBe("8%")
    expect(formatTaxRate(0)).toBe("0%")
  })
})
