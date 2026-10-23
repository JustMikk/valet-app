// Illustrative clock-in content from the design export (Staff Clock). Real values come from the
// server's check and punch; these are the fallback when a demo link opens a step directly.

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
