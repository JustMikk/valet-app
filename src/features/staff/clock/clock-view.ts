// What the clock screens say, from real facts (the server's check and punch) with the design's
// example values as the fallback when a demo link opens a step directly.
import type { ClockCheck, ClockPunch } from "@/lib/data"
import { formatHoursMinutes } from "@/lib/time/duration"
import { CLOCK_VENUE } from "@/mocks/clock"

import type { ClockSim } from "./punch"

export type ClockVenueView = {
  name: string
  hours: string
  radiusM: number
  neededAccuracyM: number
  /** Meters from the venue center, as judged by the server (or the example when none yet). */
  distanceM: number
  /** "5:51 PM": the time a clock-in would be recorded at. */
  clockInTime: string
  /** The time an approval request was sent. */
  requestTime: string
}

type VenueInput = {
  check: ClockCheck | null
  fallbackName: string | undefined
  fallbackHours: string | undefined
  sim: ClockSim
  nowLabel: string
}

export function venueView({
  check,
  fallbackName,
  fallbackHours,
  sim,
  nowLabel,
}: VenueInput): ClockVenueView {
  return {
    name: check?.venueName ?? fallbackName ?? CLOCK_VENUE.name,
    hours: check?.hoursLabel ?? fallbackHours ?? CLOCK_VENUE.hours,
    radiusM: check?.radiusM ?? CLOCK_VENUE.radiusM,
    neededAccuracyM: check?.neededAccuracyM ?? CLOCK_VENUE.neededAccuracyM,
    distanceM: check?.distanceM ?? (sim === "outside" ? 420 : 38),
    clockInTime: nowLabel,
    requestTime: nowLabel,
  }
}

export type DoneInfo = {
  effectiveLabel: string
  venueName: string
  shiftEndLabel: string
  reportTo: string
  locationLabel: string
  workedLabel: string
}

export const DEMO_DONE: DoneInfo = {
  effectiveLabel: "5:51 PM",
  venueName: "The Grand Hotel",
  shiftEndLabel: "11:00 PM",
  reportTo: "Priya, front desk",
  locationLabel: "Inside · 41 m",
  workedLabel: "2h 14m",
}

export function doneInfoFromPunch(punch: ClockPunch): DoneInfo {
  return {
    effectiveLabel: punch.effectiveLabel,
    venueName: punch.venueName,
    shiftEndLabel: punch.shiftEndLabel,
    reportTo: punch.reportTo,
    locationLabel: punch.locationLabel,
    workedLabel: formatHoursMinutes(punch.workedSecs ?? 0),
  }
}

export type DoneContent = {
  title: string
  body: string
  pending?: boolean
  rows: { k: string; v: string }[]
}

export function doneContent(step: "success" | "offline" | "outdone", info: DoneInfo): DoneContent {
  if (step === "offline") {
    return {
      title: "You're on the clock.",
      body: `No signal here, so your clock-in is saved on this phone with the original time (${info.effectiveLabel}). It syncs automatically.`,
      pending: true,
      rows: [
        { k: "Clocked in", v: info.effectiveLabel },
        { k: "Venue", v: info.venueName },
      ],
    }
  }
  if (step === "outdone") {
    return {
      title: "Shift complete.",
      body: `Clocked out at ${info.effectiveLabel}. Your manager reviews hours before they're final.`,
      rows: [
        { k: "Time worked", v: info.workedLabel },
        { k: "Clock out location", v: info.locationLabel },
      ],
    }
  }
  return {
    title: "You're on the clock.",
    body: `Clocked in at ${info.effectiveLabel} at ${info.venueName}, with location and selfie.`,
    rows: [
      { k: "Shift ends", v: info.shiftEndLabel },
      { k: "Report to", v: info.reportTo },
    ],
  }
}
