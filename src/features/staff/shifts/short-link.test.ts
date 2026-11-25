import { describe, expect, it } from "vitest"

import { shortLinkTarget } from "./short-link"

describe("shortLinkTarget", () => {
  it("opens the shift a text links to", () => {
    expect(shortLinkTarget("707f8150-0caa-47d4-a29c-fe796f77da20")).toBe(
      "/staff/shifts/detail?id=707f8150-0caa-47d4-a29c-fe796f77da20",
    )
  })

  it("falls back to the shifts list for a missing or odd id", () => {
    expect(shortLinkTarget(null)).toBe("/staff/shifts")
    expect(shortLinkTarget("")).toBe("/staff/shifts")
    expect(shortLinkTarget("x/../../admin")).toBe("/staff/shifts")
  })
})
