// Illustrative clock-in content from the design export (Staff Clock). Real values come from the
// shift, the location provider and the punch queue once those exist.

export const CLOCK_NOTE_PRESETS = [
  "Garage level 3",
  "Covered entrance",
  "Remote lot",
  "Other",
] as const

export const LOCATION_FIX_STEPS = [
  { n: 1, text: "Open Settings → Privacy → Location Services" },
  { n: 2, text: "Find Safari Websites (or Regency) and choose “While Using”" },
  { n: 3, text: "Come back here and tap Try again" },
] as const

/** Simulated geofence verdicts: ?sim=inside (default), outside, offline, denied. */
export const CLOCK_SIMS = ["inside", "outside", "offline", "denied"] as const
export type ClockSim = (typeof CLOCK_SIMS)[number]

export const CLOCK_STEPS = [
  "locating",
  "outside",
  "approval",
  "pending",
  "camera",
  "confirm",
  "success",
  "offline",
  "outdone",
  "denied",
] as const
export type ClockStep = (typeof CLOCK_STEPS)[number]

export const CLOCK_VENUE = {
  name: "The Grand Hotel",
  hours: "6:00 – 11:00 PM",
  radiusM: 150,
  neededAccuracyM: 75,
  clockInTime: "5:51 PM",
  requestTime: "5:52 PM",
} as const

type DoneContent = {
  title: string
  body: string
  pending?: boolean
  rows: { k: string; v: string }[]
}

export function doneContent(
  step: "success" | "offline" | "outdone",
  workedLabel: string,
): DoneContent {
  if (step === "offline") {
    return {
      title: "You're on the clock.",
      body: "No signal here, so your clock-in is saved on this phone with the original time (5:51 PM). It syncs automatically.",
      pending: true,
      rows: [
        { k: "Clocked in", v: "5:51 PM" },
        { k: "Venue", v: "The Grand Hotel" },
      ],
    }
  }
  if (step === "outdone") {
    return {
      title: "Shift complete.",
      body: "Clocked out at 8:05 PM. Your manager reviews hours before they're final.",
      rows: [
        { k: "Time worked", v: workedLabel },
        { k: "Clock out location", v: "Inside · 41 m" },
      ],
    }
  }
  return {
    title: "You're on the clock.",
    body: "Clocked in at 5:51 PM at The Grand Hotel, with location and selfie.",
    rows: [
      { k: "Shift ends", v: "11:00 PM" },
      { k: "Report to", v: "Priya, front desk" },
    ],
  }
}
