import { describe, expect, it } from "vitest"

import { buildCenter, type NoticeRow } from "./center"

const TZ = "America/Los_Angeles"
const now = new Date("2026-10-23T20:00:00Z") // 1 PM on Fri Oct 23 in Los Angeles

const row = (id: string, at: string, read: boolean): NoticeRow => ({
  id,
  icon: "chat_bubble",
  tone: "info",
  title: `Title ${id}`,
  body: "Body",
  href: "/staff/inbox",
  created_at: new Date(at),
  read_at: read ? new Date(at) : null,
})

describe("buildCenter", () => {
  it("splits today from earlier and keeps newest-first order within each", () => {
    const center = buildCenter(
      [
        row("a", "2026-10-23T19:00:00Z", false),
        row("b", "2026-10-23T15:00:00Z", true),
        row("c", "2026-10-21T19:00:00Z", true),
      ],
      TZ,
      now,
    )
    expect(center.groups.map((g) => g.label)).toEqual(["TODAY", "EARLIER"])
    expect(center.groups[0].items.map((i) => i.id)).toEqual(["a", "b"])
    expect(center.groups[1].items.map((i) => i.id)).toEqual(["c"])
  })

  it("counts unread rows and flags them", () => {
    const center = buildCenter(
      [row("a", "2026-10-23T19:00:00Z", false), row("b", "2026-10-23T18:00:00Z", true)],
      TZ,
      now,
    )
    expect(center.unread).toBe(1)
    expect(center.groups[0].items.map((i) => i.unread)).toEqual([true, false])
  })

  it("leaves out an empty group", () => {
    expect(buildCenter([row("a", "2026-10-23T19:00:00Z", true)], TZ, now).groups).toHaveLength(1)
    expect(buildCenter([], TZ, now)).toEqual({ groups: [], unread: 0 })
  })

  it("uses the venue's calendar day, not UTC's", () => {
    // 6 PM on Oct 22 in Los Angeles is already Oct 23 in UTC, but it was yesterday there.
    const center = buildCenter([row("a", "2026-10-23T01:00:00Z", true)], TZ, now)
    expect(center.groups[0].label).toBe("EARLIER")
  })
})
