import { describe, expect, it } from "vitest"

import { describeStart, deriveShiftMode, elapsedSeconds } from "./shift-mode"

const START = Date.parse("2026-10-23T18:00:00-07:00")
const OPENS = START - 15 * 60_000
const END = Date.parse("2026-10-23T23:00:00-07:00")
const facts = { clockInOpensAt: OPENS, endsAt: END, clockedInAt: null, clockedOutAt: null }

describe("deriveShiftMode", () => {
  it("is before until the clock-in window opens", () => {
    expect(deriveShiftMode(facts, OPENS - 1)).toBe("before")
  })

  it("is due from the moment the window opens until the event ends", () => {
    expect(deriveShiftMode(facts, OPENS)).toBe("due")
    expect(deriveShiftMode(facts, START + 10 * 60_000)).toBe("due")
    expect(deriveShiftMode(facts, END - 1)).toBe("due")
  })

  it("falls back to before once the event is over without a clock-in", () => {
    expect(deriveShiftMode(facts, END)).toBe("before")
  })

  it("is on shift after clock-in, whatever the clock says, until clock-out", () => {
    const clockedIn = { ...facts, clockedInAt: START - 9 * 60_000 }
    expect(deriveShiftMode(clockedIn, START)).toBe("onshift")
    expect(deriveShiftMode(clockedIn, END + 60 * 60_000)).toBe("onshift")
    expect(deriveShiftMode({ ...clockedIn, clockedOutAt: END }, END + 1)).toBe("before")
  })
})

describe("elapsedSeconds", () => {
  it("counts whole seconds and never goes negative", () => {
    expect(elapsedSeconds(START, START + 8047_900)).toBe(8047)
    expect(elapsedSeconds(START, START - 5_000)).toBe(0)
  })
})

describe("describeStart", () => {
  it("counts down, rounding partial minutes up", () => {
    expect(describeStart(START, START - 12 * 60_000)).toBe("Starts in 12 min")
    expect(describeStart(START, START - 30_000)).toBe("Starts in 1 min")
  })

  it("reads naturally at and after the start", () => {
    expect(describeStart(START, START)).toBe("Starting now")
    expect(describeStart(START, START + 4 * 60_000 + 5_000)).toBe("Started 4 min ago")
  })
})
