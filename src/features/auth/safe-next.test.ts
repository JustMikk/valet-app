import { describe, expect, it } from "vitest"

import { landingPath } from "./safe-next"

describe("landingPath", () => {
  it("returns to where the person was headed, inside their own app", () => {
    expect(landingPath("staff", "/staff/shifts?tab=past")).toBe("/staff/shifts?tab=past")
    expect(landingPath("admin", "/admin/events/detail?id=1")).toBe("/admin/events/detail?id=1")
  })

  it("falls back to the app's home", () => {
    expect(landingPath("staff", null)).toBe("/staff")
    expect(landingPath("admin", "")).toBe("/admin")
  })

  it("never leaves the app or the site", () => {
    expect(landingPath("staff", "/admin/hours")).toBe("/staff")
    expect(landingPath("admin", "https://evil.example")).toBe("/admin")
    expect(landingPath("admin", "//evil.example/admin")).toBe("/admin")
    expect(landingPath("staff", "/staffer")).toBe("/staff")
  })
})
