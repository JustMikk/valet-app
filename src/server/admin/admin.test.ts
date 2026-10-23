// @vitest-environment node
import { describe, expect, it } from "vitest"

import { describeFlag, toEntry } from "./hours"
import { periodLabel } from "./invoices"
import { buildLive } from "./live"
import { classifySlot, type SlotRow } from "./slots"
import { nameFromEmail, weekStart } from "./staff"

const T = (iso: string) => new Date(iso)
const TZ = "America/Los_Angeles"
// Fri Oct 23 2026, 6:04 PM PDT
const NOW = T("2026-10-23T18:04:00-07:00")

const slot = (over: Partial<SlotRow> = {}): SlotRow => ({
  assignment_id: "a1",
  staff_id: "s1",
  staff_name: "Marcus Reed",
  phone: "+14155550100",
  push_enabled: true,
  clocked_in_at: null,
  clocked_out_at: null,
  event_id: "e1",
  title: "The Grand Hotel",
  starts_at: T("2026-10-23T18:00:00-07:00"),
  ends_at: T("2026-10-23T23:00:00-07:00"),
  posted_at: T("2026-10-20T10:00:00-07:00"),
  window_min: 15,
  timezone: TZ,
  radius_m: 150,
  punch_id: null,
  punch_status: null,
  distance_m: null,
  accuracy_m: null,
  punch_note: null,
  punch_flag: null,
  punch_offline: null,
  selfie: null,
  device_at: null,
  server_at: null,
  decided_by_name: null,
  drop_name: null,
  drop_at: null,
  drop_removed: null,
  nudge_at: null,
  ...over,
})

describe("classifySlot", () => {
  it("is upcoming before the window and says when it opens (and a muted push)", () => {
    const early = classifySlot(slot({ push_enabled: false }), T("2026-10-23T16:00:00-07:00"))
    expect(early).toMatchObject({ state: "upcoming", meta: "Clock-in opens 5:45 PM · push off" })
    expect(classifySlot(slot(), T("2026-10-23T17:50:00-07:00")).meta).toBe("Clock-in open")
  })

  it("is due for ten minutes after the start, then late with the minutes", () => {
    expect(classifySlot(slot(), NOW)).toMatchObject({ state: "due", meta: "Grace ends 6:10 PM" })
    const late = classifySlot(slot(), T("2026-10-23T18:19:00-07:00"))
    expect(late.state).toBe("late")
    expect(late.facts.lateMin).toBe(19)
  })

  it("remembers a nudge", () => {
    const late = classifySlot(
      slot({ nudge_at: T("2026-10-23T18:12:00-07:00") }),
      T("2026-10-23T18:19:00-07:00"),
    )
    expect(late.facts.nudgedAt).toBe("6:12 PM")
  })

  it("reads punches: on site, flagged offline, approved override, waiting", () => {
    const punch = {
      punch_id: "p1",
      punch_status: "accepted" as const,
      distance_m: 38,
      accuracy_m: 12,
      device_at: T("2026-10-23T17:51:00-07:00"),
      server_at: T("2026-10-23T17:51:00-07:00"),
    }
    expect(classifySlot(slot(punch), NOW)).toMatchObject({
      state: "onsite",
      meta: "In 5:51 PM · 38 m from center · ±12 m",
    })
    expect(
      classifySlot(
        slot({ ...punch, punch_offline: true, server_at: T("2026-10-23T18:01:00-07:00") }),
        NOW,
      ),
    ).toMatchObject({ state: "flagged", meta: "Queued offline punch · 5:51 PM, synced 6:01 PM" })
    expect(
      classifySlot(
        slot({ ...punch, punch_status: "approved", decided_by_name: "Jamie Cole" }),
        NOW,
      ),
    ).toMatchObject({
      state: "override",
      meta: "Approved override · in 5:51 PM (request time) · by Jamie",
    })

    const waiting = classifySlot(
      slot({
        punch_id: "p2",
        punch_status: "pending_approval",
        distance_m: 420,
        accuracy_m: 38,
        punch_note: "Garage level 3",
        server_at: T("2026-10-23T17:58:00-07:00"),
      }),
      NOW,
    )
    expect(waiting.state).toBe("waiting")
    expect(waiting.facts).toMatchObject({
      outsideM: 270,
      accuracyM: 38,
      note: "Garage level 3",
      waitedMin: 6,
      punchId: "p2",
    })
  })

  it("explains why a slot is open", () => {
    const dropped = classifySlot(
      slot({
        staff_id: null,
        staff_name: null,
        drop_name: "Cole Bennett",
        drop_at: T("2026-10-23T17:12:00-07:00"),
      }),
      NOW,
    )
    expect(dropped).toMatchObject({ state: "open", meta: "Dropped by Cole B. at 5:12 PM" })
    expect(dropped.facts.openMin).toBe(52)
    expect(classifySlot(slot({ staff_id: null, staff_name: null }), NOW).meta).toBe("Posted Tue")
  })
})

describe("buildLive", () => {
  it("places events on a timeline that starts on the earliest event's day", () => {
    const live = buildLive(
      [
        slot(),
        slot({
          assignment_id: "a2",
          event_id: "e2",
          title: "The Laurel Club",
          starts_at: T("2026-10-23T19:30:00-07:00"),
          ends_at: T("2026-10-24T01:00:00-07:00"),
        }),
      ],
      NOW,
    )
    const [grand, laurel] = live.events
    expect(grand).toMatchObject({
      live: true,
      startLabel: "6:00 PM",
      rel: "started 4 min ago",
      start: 18,
      end: 23,
    })
    expect(laurel).toMatchObject({ live: false, rel: "starts in 1h 26m", start: 19.5, end: 25 })
    expect(live.timeline.from).toBe(18)
    expect(live.timeline.now).toBeCloseTo(18.067, 2)
    expect(live.timeline.ticks).toEqual([18, 20, 22, 24])
  })

  it("is empty and still has a sane axis when nothing is running", () => {
    const live = buildLive([], NOW)
    expect(live.events).toEqual([])
    expect(live.timeline.span).toBeGreaterThanOrEqual(6)
  })
})

type H = Parameters<typeof describeFlag>[0]
const hours = (over: Partial<H> = {}): H => ({
  assignment_id: "h1",
  staff_id: "s1",
  hours_status: "in_review",
  clocked_in_at: T("2026-10-23T17:52:00-07:00"),
  clocked_out_at: T("2026-10-23T23:02:00-07:00"),
  name: "Luis Torres",
  starts_at: T("2026-10-23T18:00:00-07:00"),
  ends_at: T("2026-10-23T23:00:00-07:00"),
  venue: "The Grand Hotel",
  tz: TZ,
  flag_early_out: true,
  in_status: "accepted",
  in_flag: null,
  in_offline: false,
  in_note: null,
  in_dist: 30,
  in_device_at: T("2026-10-23T17:52:00-07:00"),
  in_server_at: T("2026-10-23T17:52:00-07:00"),
  decided_by_name: null,
  out_note: null,
  out_flag: null,
  adj_reason: null,
  ...over,
})

describe("describeFlag", () => {
  it("has nothing to say about a clean shift", () => {
    expect(describeFlag(hours())).toBeNull()
    expect(toEntry(hours()).clean).toBe(true)
  })

  it("flags a missing clock-out first, and closes the entry at the scheduled end", () => {
    const row = hours({ clocked_out_at: null })
    expect(describeFlag(row)).toBe("No clock-out. Auto-closed at scheduled end.")
    const { entry } = toEntry(row)
    expect(entry).toMatchObject({ outTime: "11:00 PM", total: "5h 8m", outFlagged: true })
  })

  it("names an approved override, with who approved it and the worker's note", () => {
    expect(
      describeFlag(
        hours({
          in_status: "approved",
          in_dist: 420,
          in_note: "Garage",
          decided_by_name: "Jamie Cole",
        }),
      ),
    ).toBe("Clocked in 420 m away, approved by Jamie (garage).")
  })

  it("flags leaving early only past the threshold, with the note", () => {
    const early = hours({
      clocked_out_at: T("2026-10-23T21:42:00-07:00"),
      out_note: "family emergency",
    })
    expect(describeFlag(early)).toBe("Left 1h 18m early. Note: “family emergency”.")
    expect(describeFlag(hours({ clocked_out_at: T("2026-10-23T22:40:00-07:00") }))).toBeNull()
    expect(describeFlag({ ...early, flag_early_out: false })).toBeNull()
  })

  it("flags a punch that synced hours late", () => {
    expect(
      describeFlag(hours({ in_offline: true, in_server_at: T("2026-10-23T20:02:00-07:00") })),
    ).toBe("Synced 2h late (was offline). Times are from the phone.")
  })
})

describe("small helpers", () => {
  it("builds a placeholder name from an email", () => {
    expect(nameFromEmail("kai.morgan@gmail.com")).toBe("Kai Morgan")
    expect(nameFromEmail("ANA_RUIZ@x.io")).toBe("Ana Ruiz")
    expect(nameFromEmail("solo@x.io")).toBe("Solo")
  })

  it("finds Monday 00:00 of the week", () => {
    expect(weekStart(NOW, TZ).toISOString()).toBe("2026-10-19T07:00:00.000Z")
    expect(weekStart(T("2026-10-19T00:30:00-07:00"), TZ).toISOString()).toBe(
      "2026-10-19T07:00:00.000Z",
    )
    expect(weekStart(T("2026-10-25T23:30:00-07:00"), TZ).toISOString()).toBe(
      "2026-10-19T07:00:00.000Z",
    )
  })

  it("words an invoice period within and across months", () => {
    expect(periodLabel("2026-10-16", "2026-10-31")).toBe("Oct 16 – 31")
    expect(periodLabel("2026-10-28", "2026-11-03")).toBe("Oct 28 – Nov 3")
  })
})
