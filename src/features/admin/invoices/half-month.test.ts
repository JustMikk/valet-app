import { describe, expect, it } from "vitest"

import { halfMonth } from "./half-month"

describe("halfMonth", () => {
  it("finds the half containing a date", () => {
    expect(halfMonth(new Date(2026, 9, 10), "this")).toEqual({
      start: "2026-10-01",
      end: "2026-10-15",
    })
    expect(halfMonth(new Date(2026, 9, 23), "this")).toEqual({
      start: "2026-10-16",
      end: "2026-10-31",
    })
  })

  it("steps back one half, across months and years", () => {
    expect(halfMonth(new Date(2026, 9, 23), "last")).toEqual({
      start: "2026-10-01",
      end: "2026-10-15",
    })
    expect(halfMonth(new Date(2026, 9, 3), "last")).toEqual({
      start: "2026-09-16",
      end: "2026-09-30",
    })
    expect(halfMonth(new Date(2027, 0, 5), "last")).toEqual({
      start: "2026-12-16",
      end: "2026-12-31",
    })
  })

  it("ends February on its last day", () => {
    expect(halfMonth(new Date(2027, 2, 3), "last")).toEqual({
      start: "2027-02-16",
      end: "2027-02-28",
    })
  })
})
