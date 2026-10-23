import { describe, expect, it } from "vitest"

import { SELFIE_RETENTION_DAYS, selfieCutoff } from "./retention"

describe("selfie retention", () => {
  it("keeps photos for 30 days", () => {
    expect(SELFIE_RETENTION_DAYS).toBe(30)
  })

  it("expires punches older than 30 days and keeps newer ones", () => {
    const now = new Date("2026-11-22T12:00:00Z")
    const cutoff = selfieCutoff(now)
    expect(cutoff.toISOString()).toBe("2026-10-23T12:00:00.000Z")
    expect(new Date("2026-10-23T11:59:59Z") < cutoff).toBe(true)
    expect(new Date("2026-10-23T12:00:01Z") < cutoff).toBe(false)
  })
})
