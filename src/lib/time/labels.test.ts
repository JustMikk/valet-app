import { describe, expect, it } from "vitest"

import {
  calendarDaysBetween,
  dayKey,
  formatCompactRange,
  formatDate,
  formatDayNumber,
  formatDayWord,
  formatDuration,
  formatRange,
  formatStamp,
  formatTime,
  formatWeekdayCaps,
  formatZoneShort,
  wallTime,
  zonedInstant,
} from "./labels"

const PT = "America/Los_Angeles"
// Fri Oct 23 2026, 5:51 PM PDT
const NOW = "2026-10-23T17:51:00-07:00"

describe("venue-local labels", () => {
  it("formats date, weekday and day number in the venue zone, not the host zone", () => {
    // 01:00 UTC on Oct 24 is still the evening of Oct 23 in Pacific time.
    const instant = "2026-10-24T01:00:00Z"
    expect(formatDate(instant, PT)).toBe("Fri Oct 23")
    expect(formatWeekdayCaps(instant, PT)).toBe("FRI")
    expect(formatDayNumber(instant, PT)).toBe("23")
    expect(dayKey(instant, PT)).toBe("2026-10-23")
  })

  it("formats times with 12-hour clock including noon and midnight", () => {
    expect(formatTime("2026-10-23T18:00:00-07:00", PT)).toBe("6:00 PM")
    expect(formatTime("2026-10-23T00:05:00-07:00", PT)).toBe("12:05 AM")
    expect(formatTime("2026-10-23T12:00:00-07:00", PT)).toBe("12:00 PM")
  })

  it("collapses the meridiem when a range stays in one half of the day", () => {
    expect(formatRange("2026-10-23T18:00:00-07:00", "2026-10-23T23:00:00-07:00", PT)).toBe(
      "6:00 – 11:00 PM",
    )
    expect(formatRange("2026-10-31T19:00:00-07:00", "2026-11-01T01:00:00-07:00", PT)).toBe(
      "7:00 PM – 1:00 AM",
    )
    expect(formatRange("2026-10-25T10:00:00-07:00", "2026-10-25T15:00:00-07:00", PT)).toBe(
      "10:00 AM – 3:00 PM",
    )
  })

  it("builds the compact range used inside sentences", () => {
    expect(formatCompactRange("2026-10-23T18:00:00-07:00", "2026-10-23T23:00:00-07:00", PT)).toBe(
      "6–11 PM",
    )
    expect(formatCompactRange("2026-10-23T19:30:00-07:00", "2026-10-24T01:00:00-07:00", PT)).toBe(
      "7:30 PM – 1 AM",
    )
  })

  it("formats durations", () => {
    expect(formatDuration(5 * 3_600_000)).toBe("5h")
    expect(formatDuration(7.5 * 3_600_000)).toBe("7h 30m")
    expect(formatDuration((5 * 60 + 12) * 60_000)).toBe("5h 12m")
    expect(formatDuration(45 * 60_000)).toBe("45m")
    expect(formatDuration(-1)).toBe("0m")
  })

  it("names the zone the way the design does", () => {
    expect(formatZoneShort(NOW, PT)).toBe("PT")
  })

  it("counts calendar days in the venue zone and words them", () => {
    expect(calendarDaysBetween(NOW, "2026-10-23T23:30:00-07:00", PT)).toBe(0)
    expect(calendarDaysBetween(NOW, "2026-10-24T16:00:00-07:00", PT)).toBe(1)
    expect(formatDayWord("2026-10-23T23:30:00-07:00", NOW, PT)).toBe("Today")
    expect(formatDayWord("2026-10-24T16:00:00-07:00", NOW, PT)).toBe("Tomorrow")
    expect(formatDayWord("2026-10-27T17:30:00-07:00", NOW, PT)).toBe("Tue Oct 27")
  })

  it("stamps notifications by recency", () => {
    expect(formatStamp("2026-10-23T17:45:00-07:00", NOW, PT)).toBe("5:45 PM")
    expect(formatStamp("2026-10-22T09:00:00-07:00", NOW, PT)).toBe("Thu")
    expect(formatStamp("2026-10-01T09:00:00-07:00", NOW, PT)).toBe("Oct 1")
  })
})

describe("zonedInstant", () => {
  it("reads back the same wall time it was built from", () => {
    const instant = zonedInstant(PT, { year: 2026, month: 10, day: 24, hour: 16, minute: 0 })
    expect(instant.toISOString()).toBe("2026-10-24T23:00:00.000Z")
    expect(wallTime(instant, PT)).toMatchObject({ day: 24, hour: 16, minute: 0 })
  })

  it("uses the winter offset after daylight saving ends on Nov 1", () => {
    const instant = zonedInstant(PT, { year: 2026, month: 11, day: 2, hour: 16, minute: 0 })
    expect(instant.toISOString()).toBe("2026-11-03T00:00:00.000Z")
  })

  it("crosses midnight correctly for a late-night event end", () => {
    const instant = zonedInstant(PT, { year: 2026, month: 11, day: 1, hour: 1, minute: 0 })
    expect(formatTime(instant, PT)).toBe("1:00 AM")
    expect(formatDate(instant, PT)).toBe("Sun Nov 1")
  })
})
