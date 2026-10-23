import { describe, expect, it } from "vitest"

import type { HomeShift } from "@/lib/data"

import { buildHomeView } from "./home-view"

const START = Date.parse("2026-10-23T18:00:00-07:00")
const MIN = 60_000

const shift: HomeShift = {
  assignmentId: "a",
  venue: "The Grand Hotel",
  address: "400 Market St, San Francisco",
  shortAddress: "400 Market St",
  mapsUrl: "https://maps.google.com/?q=400+Market+St",
  venueGeo: { lat: 37.79, lng: -122.39 },
  timezone: "America/Los_Angeles",
  contact: { text: "Ask for Priya, front desk", name: "Priya", tel: "+14155550142" },
  dress: "Black suit",
  startsAt: new Date(START).toISOString(),
  endsAt: new Date(START + 300 * MIN).toISOString(),
  clockInOpensAt: new Date(START - 15 * MIN).toISOString(),
  windowMin: 15,
  dayWord: "Today",
  dateLabel: "Fri Oct 23",
  startLabel: "6:00 PM",
  endLabel: "11:00 PM",
  rangeLabel: "6:00 – 11:00 PM",
  whenLabel: "Fri Oct 23 · 6:00 – 11:00 PM · venue time (PT)",
  opensLabel: "5:45 PM",
  clockedInAt: null,
  clockedInLabel: null,
  clockedInDistanceM: null,
}

const none = { demoMode: null, pendingClockInAt: null, demoClockedInAt: 0 }

describe("buildHomeView", () => {
  it("before the window: a disabled CTA that says when it opens", () => {
    const view = buildHomeView(shift, START - 60 * MIN, none)
    expect(view.mode).toBe("before")
    expect(view.status.label).toBe("Today")
    expect(view.sub).toBe("Clock-in opens 5:45 PM")
    expect(view.ctaLabel).toBe("Clock in opens 5:45 PM")
    expect(view.ctaReason).toBe("Available 15 min before your shift starts")
  })

  it("window open: due, with a countdown to the start", () => {
    const view = buildHomeView(shift, START - 12 * MIN, none)
    expect(view.mode).toBe("due")
    expect(view.sub).toBe("Starts in 12 min")
    expect(view.ctaLabel).toBe("Clock in")
    expect(view.when.startsWith("Today, ")).toBe(true)
  })

  it("clocked in: a running clock, verified distance and progress", () => {
    const clockedIn = {
      ...shift,
      clockedInAt: new Date(START - 9 * MIN).toISOString(),
      clockedInLabel: "5:51 PM",
      clockedInDistanceM: 38,
    }
    const view = buildHomeView(clockedIn, START - 9 * MIN + 8047_000, none)
    expect(view.mode).toBe("onshift")
    expect(view.heroValue).toBe("2:14:07")
    expect(view.sub).toBe("Verified · 38 m from venue")
    expect(view.inLine).toBe("In 5:51 PM · scheduled until 11:00 PM")
    expect(view.progress).toBeGreaterThan(40)
    expect(view.progress).toBeLessThan(50)
    expect(view.when).toBe("400 Market St · Fri Oct 23")
    expect(view.ctaLabel).toBe("Clock out")
  })

  it("an unsynced offline clock-in already reads as on the clock", () => {
    const view = buildHomeView(shift, START + MIN, {
      ...none,
      pendingClockInAt: START - 9 * MIN,
    })
    expect(view.mode).toBe("onshift")
    expect(view.secs).toBe(10 * 60)
  })

  it("a demo link forces a state, and the demo on-shift clock ticks from its own start", () => {
    const view = buildHomeView(shift, START - 90 * MIN, {
      demoMode: "onshift",
      pendingClockInAt: null,
      demoClockedInAt: START - 90 * MIN - 8047_000,
    })
    expect(view.mode).toBe("onshift")
    expect(view.heroValue).toBe("2:14:07")
  })
})
