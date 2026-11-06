import { describe, expect, it } from "vitest"

import { reliability, valetStats, type DropFact, type ShiftFact } from "./valet-stats"

const TZ = "America/Chicago"
const NOW = new Date("2026-11-20T18:00:00Z")

// A 6 PM – 11 PM Central shift on the given November day (UTC-6).
const shift = (day: number, over: Partial<ShiftFact> = {}): ShiftFact => {
  const startsAt = new Date(Date.UTC(2026, 10, day, 0, 0) + 24 * 3600_000)
  return {
    venue: "Post Oak Hotel",
    startsAt,
    endsAt: new Date(startsAt.getTime() + 5 * 3600_000),
    cancelled: false,
    clockedInAt: new Date(startsAt.getTime() - 5 * 60_000),
    clockedOutAt: new Date(startsAt.getTime() + 5 * 3600_000),
    payRateCents: 2100,
    paidCents: null,
    tips: false,
    ...over,
  }
}
const drop = (late: boolean, removed = false): DropFact => ({ late, removed })

describe("valetStats", () => {
  it("counts worked shifts, hours, on-time and late arrivals with the average lateness", () => {
    const late = shift(3)
    late.clockedInAt = new Date(late.startsAt.getTime() + 12 * 60_000)
    const stats = valetStats([shift(1), shift(2), late], [], NOW, TZ)
    expect(stats).toMatchObject({ shifts: 3, onTime: 2, late: 1, avgLateMin: 12 })
    expect(stats.minutes).toBe(5 * 60 * 2 + 5 * 60 + 5 - 12 + 5)
  })

  it("gives a few minutes' grace before calling an arrival late", () => {
    const s = shift(1)
    s.clockedInAt = new Date(s.startsAt.getTime() + 5 * 60_000)
    expect(valetStats([s], [], NOW, TZ)).toMatchObject({ onTime: 1, late: 0 })
  })

  it("counts a past, uncancelled shift never clocked into as a no-show, not a future one", () => {
    const missed = shift(4, { clockedInAt: null, clockedOutAt: null })
    const cancelled = shift(5, { clockedInAt: null, clockedOutAt: null, cancelled: true })
    const coming = shift(25, { clockedInAt: null, clockedOutAt: null })
    expect(valetStats([missed, cancelled, coming], [], NOW, TZ)).toMatchObject({
      noShows: 1,
      shifts: 0,
    })
  })

  it("separates drops with notice, late drops and removals by an admin", () => {
    const stats = valetStats([], [drop(false), drop(true), drop(false, true)], NOW, TZ)
    expect(stats).toMatchObject({ drops: 2, lateDrops: 1, removed: 1 })
  })

  it("adds up earnings at each shift's rate, keeping paid amounts as paid", () => {
    const paid = shift(1, { paidCents: 9000 })
    const stats = valetStats([paid, shift(2, { tips: true })], [], NOW, TZ)
    // The unpaid shift: 5 h 5 min at $21 = $106.75.
    expect(stats).toMatchObject({ earnedCents: 9000 + 10_675, paidCents: 9000, tipsShifts: 1 })
    expect(stats.pendingCents).toBe(10_675)
  })

  it("lists the venues worked most and the months in venue-local time", () => {
    const stats = valetStats([shift(1), shift(2), shift(3, { venue: "Hilton" })], [], NOW, TZ)
    expect(stats.venues[0]).toMatchObject({ venue: "Post Oak Hotel", shifts: 2 })
    expect(stats.months.at(-1)).toMatchObject({ label: "Nov 2026", shifts: 3 })
    expect(stats.months).toHaveLength(6)
  })
})

describe("reliability", () => {
  const base = { onTime: 0, late: 0, noShows: 0, drops: 0, lateDrops: 0 }

  it("is new until there are three commitments to judge", () => {
    expect(reliability({ ...base, onTime: 2 })).toMatchObject({ value: null, band: "new" })
  })

  it("is 100 and excellent for every shift on time", () => {
    expect(reliability({ ...base, onTime: 10 })).toMatchObject({ value: 100, band: "excellent" })
  })

  it("weighs lateness, drops and no-shows, and says why", () => {
    const result = reliability({ onTime: 6, late: 2, noShows: 1, drops: 1, lateDrops: 0 })
    // (6 + 2 × 0.7 + 0 + 0.8) / 10 = 82
    expect(result.value).toBe(82)
    expect(result.band).toBe("good")
    expect(result.reasons).toEqual([
      "6 of 8 shifts started on time",
      "2 late arrivals",
      "1 no-show",
      "1 drop with notice",
    ])
  })

  it("puts repeated no-shows at risk", () => {
    expect(reliability({ ...base, onTime: 2, noShows: 2, drops: 1, lateDrops: 1 }).band).toBe(
      "risk",
    )
  })
})
