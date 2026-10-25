import { describe, expect, it } from "vitest"

import { DEMO_DONE, doneContent, doneInfoFromPunch, venueView } from "./clock-view"

describe("doneContent", () => {
  it("reproduces the design's copy from the example facts", () => {
    expect(doneContent("success", DEMO_DONE)).toEqual({
      title: "You're on the clock.",
      body: "Clocked in at 5:51 PM at The Grand Hotel, with location and selfie.",
      rows: [
        { k: "Shift ends", v: "11:00 PM" },
        { k: "Report to", v: "Priya, front desk" },
      ],
    })
    expect(doneContent("offline", DEMO_DONE).body).toBe(
      "No signal here, so your clock-in is saved on this phone with the original time (5:51 PM). It syncs automatically.",
    )
    expect(doneContent("offline", DEMO_DONE).pending).toBe(true)
    expect(doneContent("outdone", { ...DEMO_DONE, effectiveLabel: "8:05 PM" }).body).toBe(
      "Clocked out at 8:05 PM. Your manager reviews hours before they're final.",
    )
  })

  it("reads worked time and location from the server's punch", () => {
    const info = doneInfoFromPunch({
      punchId: "p",
      status: "accepted",
      flagged: false,
      effectiveAt: "2026-10-23T20:05:00Z",
      effectiveLabel: "8:05 PM",
      venueName: "The Grand Hotel",
      shiftEndLabel: "11:00 PM",
      reportTo: "Priya, front desk",
      locationLabel: "Inside · 41 m",
      workedSecs: 8047,
    })
    expect(doneContent("outdone", info).rows).toEqual([
      { k: "Time worked", v: "2h 14m" },
      { k: "Clock out location", v: "Inside · 41 m" },
    ])
  })
})

describe("venueView", () => {
  it("prefers the server's check over fallbacks", () => {
    const view = venueView({
      check: {
        verdict: "outside",
        distanceM: 420,
        radiusM: 250,
        neededAccuracyM: 75,
        venueName: "Harbor Pavilion",
        hoursLabel: "4:00 – 11:30 PM",
      },
      fallbackName: "x",
      fallbackHours: "y",
      sim: "inside",
      nowLabel: "5:49 PM",
    })
    expect(view).toMatchObject({
      name: "Harbor Pavilion",
      radiusM: 250,
      distanceM: 420,
      requestTime: "5:49 PM",
    })
  })

  it("falls back to the design's example when a demo link skips the check", () => {
    const view = venueView({
      check: null,
      fallbackName: undefined,
      fallbackHours: undefined,
      sim: "outside",
      nowLabel: "5:49 PM",
    })
    expect(view).toMatchObject({ name: "The Grand Hotel", radiusM: 150, distanceM: 420 })
  })
})
