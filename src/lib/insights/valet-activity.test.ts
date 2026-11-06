import { describe, expect, it } from "vitest"

import { valetActivity, type ActivityFacts } from "./valet-activity"

const TZ = "America/Chicago"
// Wed Nov 4 2026, 6 PM – 11 PM Central (UTC-6).
const START = new Date("2026-11-05T00:00:00Z")
const END = new Date("2026-11-05T05:00:00Z")
const NOW = new Date("2026-11-20T12:00:00Z")
const at = (minutesFromStart: number) => new Date(START.getTime() + minutesFromStart * 60_000)

const empty: ActivityFacts = {
  invitedAt: null,
  onboardedAt: null,
  shifts: [],
  drops: [],
  punches: [],
  adjustments: [],
}

const shift = {
  id: "a1",
  event: "Post Oak Hotel · Gala",
  tz: TZ,
  startsAt: START,
  endsAt: END,
  cancelled: false,
  claimedAt: null,
  assignedAt: null,
  assignedBy: null,
  clockedInAt: at(-3),
  clockedOutAt: at(300),
  paidAt: null,
  paidCents: null,
}

const punch = {
  id: "p1",
  event: "Post Oak Hotel · Gala",
  tz: TZ,
  startsAt: START,
  kind: "in" as const,
  at: at(-3),
  geofence: "inside" as const,
  distanceM: 20,
  status: "accepted" as const,
  flagged: false,
  flagReason: null,
  offline: false,
}

describe("valetActivity", () => {
  it("lists everything newest first, each with its time in the venue's zone", () => {
    const items = valetActivity(
      {
        ...empty,
        shifts: [{ ...shift, claimedAt: new Date("2026-11-01T15:00:00Z") }],
        punches: [punch, { ...punch, id: "p2", kind: "out", at: at(300) }],
      },
      NOW,
    )
    expect(items.map((item) => item.kind)).toEqual(["clock_out", "clock_in", "claimed"])
    expect(items[1]).toMatchObject({
      title: "Clocked in · Post Oak Hotel · Gala",
      detail: "On time · Inside the fence",
      when: "Wed Nov 4 · 5:57 PM",
      issue: false,
    })
  })

  it("flags a late clock-in outside the fence that waited for approval", () => {
    const [item] = valetActivity(
      {
        ...empty,
        punches: [
          { ...punch, at: at(14), geofence: "outside", distanceM: 212, status: "pending_approval" },
        ],
      },
      NOW,
    )
    expect(item).toMatchObject({
      detail: "14 min late · 212 m outside the fence · Waiting for approval",
      issue: true,
    })
  })

  it("records a no-show for a past shift never clocked into, and not for a cancelled one", () => {
    const missed = { ...shift, clockedInAt: null, clockedOutAt: null }
    const items = valetActivity(
      { ...empty, shifts: [missed, { ...missed, id: "a2", cancelled: true }] },
      NOW,
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: "no_show",
      title: "No-show · Post Oak Hotel · Gala",
      issue: true,
    })
  })

  it("says who assigned, removed or corrected, why a drop happened, and what was paid", () => {
    const items = valetActivity(
      {
        ...empty,
        shifts: [
          {
            ...shift,
            assignedAt: new Date("2026-11-02T15:00:00Z"),
            assignedBy: "Jamie Cole",
            paidAt: new Date("2026-11-10T15:00:00Z"),
            paidCents: 10_675,
          },
        ],
        drops: [
          {
            id: "d1",
            event: "Hilton · Brunch",
            tz: TZ,
            at: new Date("2026-11-03T15:00:00Z"),
            reason: "sick",
            note: "Fever",
            late: true,
            removedBy: null,
          },
        ],
        adjustments: [
          {
            id: "h1",
            event: "Post Oak Hotel · Gala",
            tz: TZ,
            at: new Date("2026-11-06T15:00:00Z"),
            reason: "Forgot to clock out",
            by: "Jamie Cole",
          },
        ],
      },
      NOW,
    )
    const byKind = Object.fromEntries(items.map((item) => [item.kind, item]))
    expect(byKind.assigned).toMatchObject({
      title: "Assigned to Post Oak Hotel · Gala",
      detail: "By Jamie Cole",
    })
    expect(byKind.dropped).toMatchObject({
      title: "Dropped Hilton · Brunch",
      detail: "Within 24 hours · sick · “Fever”",
      issue: true,
    })
    expect(byKind.adjusted).toMatchObject({ detail: "By Jamie Cole: Forgot to clock out" })
    expect(byKind.paid).toMatchObject({ title: "Paid $106.75 · Post Oak Hotel · Gala" })
  })

  it("starts with the invitation and sign-up", () => {
    const items = valetActivity(
      {
        ...empty,
        invitedAt: new Date("2026-10-01T15:00:00Z"),
        onboardedAt: new Date("2026-10-02T15:00:00Z"),
      },
      NOW,
      TZ,
    )
    expect(items.map((item) => item.title)).toEqual(["Finished sign-up", "Invited to the app"])
  })
})
