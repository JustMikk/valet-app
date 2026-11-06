// One valet's record over a period (ADR-024): attendance, earnings, where and when they worked, and
// a reliability score an admin can read and explain. Pure: the server feeds it database rows.
import { amountCents } from "@/lib/money/format"
import { wallTime } from "@/lib/time/labels"

/** Minutes after the start before a clock-in counts as late. */
export const GRACE_MIN = 5
const MINUTE = 60_000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export type ShiftFact = {
  venue: string
  startsAt: Date
  endsAt: Date
  cancelled: boolean
  clockedInAt: Date | null
  clockedOutAt: Date | null
  payRateCents: number
  paidCents: number | null
  tips: boolean
}

/** `removed`: an admin took them off the shift; it doesn't count against them. */
export type DropFact = { late: boolean; removed: boolean }

export type MonthStats = {
  label: string
  shifts: number
  minutes: number
  late: number
  noShows: number
}
export type VenueStats = { venue: string; shifts: number; minutes: number }

export type ValetStats = {
  shifts: number
  minutes: number
  onTime: number
  late: number
  avgLateMin: number | null
  noShows: number
  drops: number
  lateDrops: number
  removed: number
  tipsShifts: number
  earnedCents: number
  paidCents: number
  pendingCents: number
  months: MonthStats[]
  venues: VenueStats[]
}

const lateBy = (shift: ShiftFact) =>
  shift.clockedInAt ? (shift.clockedInAt.getTime() - shift.startsAt.getTime()) / MINUTE : 0

const isNoShow = (shift: ShiftFact, now: Date) =>
  !shift.cancelled && shift.clockedInAt === null && shift.endsAt < now

function lastMonths(now: Date, tz: string, count: number): { key: string; label: string }[] {
  const { year, month } = wallTime(now, tz)
  return Array.from({ length: count }, (_, i) => {
    const index = year * 12 + (month - 1) - (count - 1 - i)
    const y = Math.floor(index / 12)
    const m = index % 12
    return { key: `${y}-${m}`, label: `${MONTHS[m]} ${y}` }
  })
}

export function valetStats(
  shifts: ShiftFact[],
  drops: DropFact[],
  now: Date,
  tz: string,
): ValetStats {
  const worked = shifts.filter((shift) => shift.clockedInAt !== null)
  const late = worked.filter((shift) => lateBy(shift) > GRACE_MIN)
  const noShows = shifts.filter((shift) => isNoShow(shift, now))
  const done = worked.filter((shift) => shift.clockedOutAt !== null)
  const minutesOf = (shift: ShiftFact) =>
    shift.clockedInAt && shift.clockedOutAt
      ? Math.max(
          0,
          Math.round((shift.clockedOutAt.getTime() - shift.clockedInAt.getTime()) / MINUTE),
        )
      : 0
  const earned = done.map(
    (shift) => shift.paidCents ?? amountCents(minutesOf(shift), shift.payRateCents),
  )
  const earnedCents = earned.reduce((sum, cents) => sum + cents, 0)
  const paidCents = done.reduce((sum, shift) => sum + (shift.paidCents ?? 0), 0)

  const months = lastMonths(now, tz, 6).map(({ key, label }) => {
    const inMonth = (shift: ShiftFact) => {
      const w = wallTime(shift.startsAt, tz)
      return `${w.year}-${w.month - 1}` === key
    }
    return {
      label,
      shifts: worked.filter(inMonth).length,
      minutes: worked.filter(inMonth).reduce((sum, shift) => sum + minutesOf(shift), 0),
      late: late.filter(inMonth).length,
      noShows: noShows.filter(inMonth).length,
    }
  })

  const byVenue = new Map<string, VenueStats>()
  for (const shift of worked) {
    const entry = byVenue.get(shift.venue) ?? { venue: shift.venue, shifts: 0, minutes: 0 }
    entry.shifts += 1
    entry.minutes += minutesOf(shift)
    byVenue.set(shift.venue, entry)
  }

  const counted = drops.filter((drop) => !drop.removed)
  return {
    shifts: worked.length,
    minutes: worked.reduce((sum, shift) => sum + minutesOf(shift), 0),
    onTime: worked.length - late.length,
    late: late.length,
    avgLateMin: late.length
      ? Math.round(late.reduce((sum, shift) => sum + lateBy(shift), 0) / late.length)
      : null,
    noShows: noShows.length,
    drops: counted.length,
    lateDrops: counted.filter((drop) => drop.late).length,
    removed: drops.length - counted.length,
    tipsShifts: worked.filter((shift) => shift.tips).length,
    earnedCents,
    paidCents,
    pendingCents: earnedCents - paidCents,
    months,
    venues: [...byVenue.values()].sort((a, b) => b.shifts - a.shifts).slice(0, 5),
  }
}

export type ReliabilityBand = "excellent" | "good" | "watch" | "risk" | "new"

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * 0–100 from what they committed to: a shift on time is worth 1, a late arrival 0.7, a drop with
 * more than 24 hours' notice 0.8, a later drop 0.3 and a no-show 0. Needs three commitments,
 * except that any no-show is scored at once, so it never hides behind "New".
 */
export function reliability(input: {
  onTime: number
  late: number
  noShows: number
  drops: number
  lateDrops: number
}): { value: number | null; band: ReliabilityBand; reasons: string[] } {
  const { onTime, late, noShows, drops, lateDrops } = input
  const earlyDrops = drops - lateDrops
  const committed = onTime + late + noShows + drops
  const reasons: string[] = []
  if (onTime + late > 0) reasons.push(`${onTime} of ${onTime + late} shifts started on time`)
  if (late) reasons.push(plural(late, "late arrival", "late arrivals"))
  if (noShows) reasons.push(plural(noShows, "no-show", "no-shows"))
  if (lateDrops) reasons.push(plural(lateDrops, "drop within 24 hours", "drops within 24 hours"))
  if (earlyDrops) reasons.push(plural(earlyDrops, "drop with notice", "drops with notice"))
  if (committed < 3 && noShows === 0) {
    return { value: null, band: "new", reasons: [...reasons, "Not enough shifts to score yet"] }
  }
  const points = onTime + late * 0.7 + earlyDrops * 0.8 + lateDrops * 0.3
  const value = Math.round((100 * points) / committed)
  const band = value >= 90 ? "excellent" : value >= 75 ? "good" : value >= 60 ? "watch" : "risk"
  return { value, band, reasons }
}
