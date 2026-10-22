import { describe, expect, it } from "vitest"

import { ICON_NAMES } from "@/lib/icons/icon-names"

import { STATUS, type StatusSpec } from "./presets"

const specs: [string, StatusSpec][] = Object.entries(STATUS).map(([key, value]) => [
  key,
  typeof value === "function" ? value(12) : value,
])

describe("STATUS presets", () => {
  it("cover the 12 slot and health states of the Design System sheet", () => {
    expect(specs.map(([, s]) => s.label)).toEqual([
      "On site",
      "Flagged · queued",
      "Expected",
      "Due now",
      "Late 12 min",
      "Waiting approval",
      "Open slot",
      "Clocked out",
      "Missing clock-out",
      "No-show",
      "Dropped",
      "Push off",
    ])
  })

  it.each(specs)("%s pairs an icon with words, never color alone", (_, spec) => {
    expect(ICON_NAMES).toContain(spec.icon)
    expect(spec.label.trim().length).toBeGreaterThan(0)
  })

  it("formats lateness in whole minutes, rounding up so it is never 0", () => {
    expect(STATUS.late(3).label).toBe("Late 3 min")
    expect(STATUS.late(0.4).label).toBe("Late 1 min")
    expect(STATUS.late(12.2).label).toBe("Late 13 min")
  })

  it("does not print a number when the lateness is unknown", () => {
    expect(STATUS.late(Number.NaN).label).toBe("Late")
    expect(STATUS.late(-5).label).toBe("Late 1 min")
  })
})
