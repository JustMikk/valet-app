import { describe, expect, it } from "vitest"

import { describeCountdown, formatTimeLeft } from "./countdown"

const MIN = 60_000
const HOUR = 60 * MIN
const START = Date.parse("2026-10-23T18:00:00-07:00")
const END = START + 5 * HOUR

describe("formatTimeLeft", () => {
  it("counts minutes under an hour, rounding up so it never reads 0", () => {
    expect(formatTimeLeft(12 * MIN)).toBe("12 min")
    expect(formatTimeLeft(12 * MIN + 1_000)).toBe("13 min")
    expect(formatTimeLeft(1_000)).toBe("1 min")
  })

  it("counts hours and minutes under two days", () => {
    expect(formatTimeLeft(HOUR)).toBe("1h")
    expect(formatTimeLeft(86 * MIN)).toBe("1h 26m")
    expect(formatTimeLeft(47 * HOUR + 59 * MIN)).toBe("47h 59m")
  })

  it("counts days and hours from two days", () => {
    expect(formatTimeLeft(48 * HOUR)).toBe("2d")
    expect(formatTimeLeft(51 * HOUR)).toBe("2d 3h")
  })
})

describe("describeCountdown", () => {
  it("counts down to the start", () => {
    expect(describeCountdown(START, END, START - 86 * MIN)).toBe("Starts in 1h 26m")
  })

  it("counts what is left once it has started", () => {
    expect(describeCountdown(START, END, START + 110 * MIN)).toBe("In progress · 3h 10m left")
  })

  it("counts nothing once it is over", () => {
    expect(describeCountdown(START, END, END)).toBeNull()
    expect(describeCountdown(START, END, END + HOUR)).toBeNull()
  })

  it("takes ISO strings as the API sends them", () => {
    expect(
      describeCountdown("2026-10-24T01:00:00Z", "2026-10-24T06:00:00Z", START - 30 * MIN),
    ).toBe("Starts in 30 min")
  })
})
