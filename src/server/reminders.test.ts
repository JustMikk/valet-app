// @vitest-environment node
import { describe, expect, it } from "vitest"

import { dueOffsets } from "./reminders"

const HOUR = 60 * 60 * 1000
const start = new Date("2026-11-28T00:00:00Z") // a 6 PM Central shift
const at = (hoursBefore: number) => new Date(start.getTime() - hoursBefore * HOUR)
// Assigned well before either reminder.
const early = at(72)

describe("dueOffsets", () => {
  it("sends nothing before the 24 h mark", () => {
    expect(dueOffsets(start, early, at(25))).toEqual([])
  })

  it("sends the 24 h reminder from 24 h before the start", () => {
    expect(dueOffsets(start, early, at(24))).toEqual([24])
    expect(dueOffsets(start, early, at(23.9))).toEqual([24])
  })

  it("sends the 1 h reminder from 1 h before the start", () => {
    expect(dueOffsets(start, early, at(1))).toEqual([1])
    expect(dueOffsets(start, early, at(0.5))).toEqual([1])
  })

  it("never has both due at once", () => {
    for (const h of [24, 12, 2, 1.01, 1, 0.99, 0.01]) {
      expect(dueOffsets(start, early, at(h)).length).toBeLessThanOrEqual(1)
    }
  })

  it("still sends a late 24 h reminder until 1 h before, then drops it", () => {
    expect(dueOffsets(start, early, at(2))).toEqual([24])
    expect(dueOffsets(start, early, at(1.01))).toEqual([24])
  })

  it("drops the 1 h reminder once the shift has started", () => {
    expect(dueOffsets(start, early, at(0))).toEqual([])
    expect(dueOffsets(start, early, at(-0.5))).toEqual([])
  })

  it("gives a shift assigned after the 24 h mark only the 1 h reminder", () => {
    const assigned = at(5)
    expect(dueOffsets(start, assigned, at(4.9))).toEqual([])
    expect(dueOffsets(start, assigned, at(1))).toEqual([1])
  })

  it("gives a shift assigned within the last hour no reminder", () => {
    const assigned = at(0.5)
    expect(dueOffsets(start, assigned, at(0.4))).toEqual([])
  })

  it("re-arms for a new start time: the reminder follows the shift, not the old time", () => {
    const moved = new Date(start.getTime() + 48 * HOUR)
    expect(dueOffsets(moved, early, at(24))).toEqual([])
    expect(dueOffsets(moved, early, new Date(moved.getTime() - 24 * HOUR))).toEqual([24])
  })
})
