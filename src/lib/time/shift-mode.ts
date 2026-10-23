// Where a worker stands relative to a shift (product spec §7.7, §8.3). One pure function shared by
// the server (status of a card) and the screens (live re-derivation as the clock moves).

export type ShiftMode = "before" | "due" | "onshift"

type Stamp = Date | string | number

export type ShiftClockFacts = {
  clockInOpensAt: Stamp
  endsAt: Stamp
  clockedInAt: Stamp | null
  clockedOutAt?: Stamp | null
}

const ms = (stamp: Stamp) => new Date(stamp).getTime()

/**
 * `onshift` once clocked in (until clocked out), `due` while the clock-in window is open and the
 * event has not ended, otherwise `before`.
 */
export function deriveShiftMode(facts: ShiftClockFacts, now: number): ShiftMode {
  if (facts.clockedInAt && !facts.clockedOutAt) return "onshift"
  if (now >= ms(facts.clockInOpensAt) && now < ms(facts.endsAt)) return "due"
  return "before"
}

/** Whole seconds worked since clock-in (never negative). */
export function elapsedSeconds(clockedInAt: Stamp, now: number): number {
  return Math.max(0, Math.floor((now - ms(clockedInAt)) / 1000))
}

/** "Starts in 12 min", "Starting now" or "Started 4 min ago" for the Home sub-line. */
export function describeStart(startsAt: Stamp, now: number): string {
  const minutes = Math.ceil((ms(startsAt) - now) / 60_000)
  if (minutes > 0) return `Starts in ${minutes} min`
  const ago = Math.floor((now - ms(startsAt)) / 60_000)
  return ago <= 0 ? "Starting now" : `Started ${ago} min ago`
}
