// @vitest-environment node
import { describe, expect, it } from "vitest"

import { closestToYesterday, type PulseRow } from "./pulse"

const NOW = new Date("2026-10-23T18:04:00-07:00")
const row = (iso: string, need: number): PulseRow => ({
  taken_at: new Date(iso),
  need,
  live: 1,
  on_shift: 4,
  expected: 2,
  open: 3,
})

describe("closestToYesterday", () => {
  it("picks the snapshot nearest to exactly 24 hours ago", () => {
    const picked = closestToYesterday(
      [
        row("2026-10-22T17:52:00-07:00", 1),
        row("2026-10-22T18:02:00-07:00", 2),
        row("2026-10-22T18:12:00-07:00", 3),
      ],
      NOW,
    )
    expect(picked).toEqual({ need: 2, live: 1, onShift: 4, expected: 2, open: 3 })
  })

  it("is null when nothing falls within 15 minutes", () => {
    expect(closestToYesterday([row("2026-10-22T17:40:00-07:00", 1)], NOW)).toBeNull()
    expect(closestToYesterday([], NOW)).toBeNull()
  })
})
