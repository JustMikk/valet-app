// @vitest-environment node
import { describe, expect, it } from "vitest"

import type { ShiftRow } from "./shift-data"
import { toHomeShift, toPastCard, toShiftDetail, toUpcomingCard } from "./shift-view"

const T = (iso: string) => new Date(iso)
// Fri Oct 23 2026, 5:48 PM PDT
const NOW = T("2026-10-23T17:48:00-07:00")

const row = (over: Partial<ShiftRow> = {}): ShiftRow => ({
  assignment_id: "a1",
  status: "confirmed",
  hours_status: "in_review",
  clocked_in_at: null,
  clocked_out_at: null,
  event_id: "e1",
  title: "The Grand Hotel",
  starts_at: T("2026-10-23T18:00:00-07:00"),
  ends_at: T("2026-10-23T23:00:00-07:00"),
  window_min: 15,
  crew_size: 6,
  contact_text: "Ask for Priya, front desk",
  contact_name: "Priya",
  contact_tel: "+14155550142",
  dress_code: "Black suit",
  instructions: "East lot.",
  venue_name: "The Grand Hotel",
  address: "400 Market St, San Francisco",
  short_address: "400 Market St",
  maps_url: "https://maps.google.com/?q=x",
  timezone: "America/Los_Angeles",
  lat: 37.79,
  lng: -122.39,
  radius_m: 150,
  min_accuracy_m: 75,
  in_distance_m: null,
  ...over,
})

describe("toHomeShift", () => {
  it("labels tonight's shift the way the design does", () => {
    const home = toHomeShift(row(), NOW)
    expect(home).toMatchObject({
      dayWord: "Today",
      dateLabel: "Fri Oct 23",
      startLabel: "6:00 PM",
      endLabel: "11:00 PM",
      rangeLabel: "6:00 – 11:00 PM",
      whenLabel: "Fri Oct 23 · 6:00 – 11:00 PM · venue time (PT)",
      opensLabel: "5:45 PM",
    })
  })

  it("names the weekday for a clock-in that opens on another day", () => {
    const harbor = row({
      starts_at: T("2026-10-24T16:00:00-07:00"),
      ends_at: T("2026-10-24T23:30:00-07:00"),
    })
    const home = toHomeShift(harbor, NOW)
    expect(home.dayWord).toBe("Tomorrow")
    expect(home.opensLabel).toBe("Sat 3:45 PM")
  })
})

describe("shift cards", () => {
  it("marks tonight's card by what the worker can do right now", () => {
    expect(toUpcomingCard(row(), NOW).status.label).toBe("Clock-in open")
    expect(toUpcomingCard(row(), T("2026-10-23T15:00:00-07:00")).status.label).toBe("Today")
    expect(
      toUpcomingCard(row({ clocked_in_at: T("2026-10-23T17:51:00-07:00") }), NOW).status.label,
    ).toBe("Today · on now")
    expect(toUpcomingCard(row(), NOW).isTonight).toBe(true)
  })

  it("distinguishes assigned from self-claimed shifts later in the week", () => {
    const later = {
      starts_at: T("2026-10-27T17:30:00-07:00"),
      ends_at: T("2026-10-27T22:30:00-07:00"),
    }
    expect(toUpcomingCard(row(later), NOW).status.label).toBe("Confirmed")
    expect(toUpcomingCard(row({ ...later, status: "claimed" }), NOW).status.label).toBe("Claimed")
    expect(toUpcomingCard(row(later), NOW)).toMatchObject({
      date: "Tue Oct 27",
      time: "5:30 – 10:30 PM",
      right: "5h",
      isTonight: false,
    })
  })

  it("summarises a finished shift by what was worked and whether hours are approved", () => {
    const done = row({
      status: "completed",
      hours_status: "approved",
      starts_at: T("2026-10-22T18:00:00-07:00"),
      ends_at: T("2026-10-22T23:00:00-07:00"),
      clocked_in_at: T("2026-10-22T17:52:00-07:00"),
      clocked_out_at: T("2026-10-22T23:04:00-07:00"),
    })
    expect(toPastCard(done)).toMatchObject({
      status: { label: "Approved", tone: "ok" },
      time: "In 5:52 PM · Out 11:04 PM",
      right: "5h 12m",
    })
    expect(toPastCard({ ...done, hours_status: "in_review" }).status.label).toBe("In review")
  })
})

describe("toShiftDetail", () => {
  const harbor = row({
    status: "claimed",
    starts_at: T("2026-10-25T16:00:00-07:00"),
    ends_at: T("2026-10-25T23:30:00-07:00"),
  })

  it("explains when clock-in opens and lets the worker drop", () => {
    const detail = toShiftDetail(harbor, NOW)
    expect(detail.status.label).toBe("Claimed · Sun Oct 25")
    expect(detail.when).toBe("4:00 – 11:30 PM · 7h 30m · venue time (PT)")
    expect(detail.clockNotice).toBe("Clock-in opens Sun 3:45 PM, 15 min before start.")
    expect(detail.canDrop).toBe(true)
    expect(detail.lateDrop).toBe(false)
  })

  it("flags a drop inside 24 hours as late", () => {
    expect(toShiftDetail(row(), T("2026-10-23T09:00:00-07:00")).lateDrop).toBe(true)
  })

  it("never offers a drop once clocked in, started or finished", () => {
    expect(toShiftDetail(row({ clocked_in_at: NOW }), NOW).canDrop).toBe(false)
    expect(toShiftDetail(row(), T("2026-10-23T18:30:00-07:00")).canDrop).toBe(false)
    const past = toShiftDetail(row({ status: "completed" }), NOW)
    expect(past.canDrop).toBe(false)
    expect(past.clockNotice).toBeNull()
  })
})
