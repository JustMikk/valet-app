// @vitest-environment node
import { describe, expect, it } from "vitest"

import { buildFixtures, SCENARIOS } from "./fixtures"

const NOW = new Date("2026-10-23T18:00:00Z")

describe.each(SCENARIOS)("demo fixtures (%s)", (scenario) => {
  const data = buildFixtures(NOW, scenario)
  const jordan = data.staff[0]
  const tonight = data.events[0]

  it("holds every slot invariant the database enforces", () => {
    for (const slot of data.assignments) {
      expect((slot.status === "open") === (slot.staff_id === null)).toBe(true)
    }
    for (const event of data.events) {
      expect(Date.parse(String(event.ends_at))).toBeGreaterThan(Date.parse(String(event.starts_at)))
      const slots = data.assignments.filter((slot) => slot.event_id === event.id)
      expect(slots).toHaveLength(Number(event.crew_size))
    }
  })

  it("never seats one person twice in the same event", () => {
    const seen = new Set<string>()
    for (const slot of data.assignments) {
      if (!slot.staff_id) continue
      const key = `${slot.event_id}:${slot.staff_id}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it("gives the demo worker a live shift tonight, a claimed one later and three finished ones", () => {
    const mine = data.assignments.filter((slot) => slot.staff_id === jordan.id)
    expect(mine.some((slot) => slot.event_id === tonight.id)).toBe(true)
    expect(mine.filter((slot) => slot.status === "claimed")).toHaveLength(1)
    expect(mine.filter((slot) => slot.status === "completed")).toHaveLength(3)
  })

  it("keeps the open-shift feed interesting: spots left and one that clashes with tonight", () => {
    const open = data.assignments.filter((slot) => slot.status === "open")
    expect(new Set(open.map((slot) => slot.event_id)).size).toBeGreaterThanOrEqual(4)
    const laurel = data.events.find((event) => event.title === "The Laurel Club")
    expect(Date.parse(String(laurel?.starts_at))).toBeLessThan(Date.parse(String(tonight.ends_at)))
    expect(Date.parse(String(laurel?.starts_at))).toBeGreaterThan(NOW.getTime())
  })

  it("places tonight's start where the scenario says", () => {
    const start = Date.parse(String(tonight.starts_at))
    const minutes = (start - NOW.getTime()) / 60_000
    if (scenario === "due") expect(minutes).toBeCloseTo(12, 0)
    if (scenario === "before") expect(minutes).toBeGreaterThan(15)
    if (scenario === "onshift") {
      expect(minutes).toBeLessThan(0)
      const mine = data.assignments.find(
        (slot) => slot.event_id === tonight.id && slot.staff_id === jordan.id,
      )
      expect(mine?.clocked_in_at).toBeTruthy()
    }
  })

  it("keeps rates off everything staff can read, and only on venues and invoices", () => {
    const staffReadable = [...data.events, ...data.assignments, ...data.punches, ...data.drops]
    const keys = new Set(staffReadable.flatMap((row) => Object.keys(row)))
    for (const key of keys) expect(key).not.toMatch(/rate|pay|bill|wage/i)
    expect(data.venues.every((venue) => Number(venue.bill_rate_cents) > 0)).toBe(true)
  })

  it("seeds a living operation for the admin side", () => {
    const states = new Set<string>()
    for (const slot of data.assignments) states.add(String(slot.status))
    expect(states).toContain("open")
    expect(data.staff.length).toBeGreaterThan(30)
    expect(data.staff.some((s) => s.onboarded_at === null)).toBe(true)
    expect(data.staff.some((s) => s.active === false)).toBe(true)
    expect(data.invoices).toHaveLength(5)
    expect(new Set(data.invoices.map((i) => i.status))).toEqual(new Set(["draft", "sent", "paid"]))
    expect(data.broadcasts.length).toBeGreaterThanOrEqual(2)
    expect(data.events.some((e) => e.status === "draft")).toBe(true)
  })

  it("makes each invoice total the sum of its lines", () => {
    for (const invoice of data.invoices) {
      const lines = data.invoice_lines.filter((line) => line.invoice_id === invoice.id)
      const sum = lines.reduce((n, line) => n + Number(line.amount_cents), 0)
      expect(sum).toBe(invoice.total_cents)
    }
  })
})
