// How long until a shift starts, or how long is left in it: "Starts in 1h 26m". Pure, so the
// wording is tested here and the screens only re-ask as the clock moves.

type Stamp = Date | string | number

const MINUTE = 60_000

const ms = (stamp: Stamp) => new Date(stamp).getTime()

/** "12 min", "1h 26m", "5h", "3d 4h": minutes under an hour, hours under two days, then days. */
export function formatTimeLeft(milliseconds: number): string {
  const minutes = Math.max(1, Math.ceil(milliseconds / MINUTE))
  if (minutes < 60) return `${minutes} min`
  if (minutes < 48 * 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }
  const d = Math.floor(minutes / (24 * 60))
  const h = Math.floor((minutes % (24 * 60)) / 60)
  return h === 0 ? `${d}d` : `${d}d ${h}h`
}

/**
 * "Starts in 1h 26m" before the shift, "In progress · 3h 10m left" during it, null once it is
 * over (a past shift has nothing left to count).
 */
export function describeCountdown(startsAt: Stamp, endsAt: Stamp, now: number): string | null {
  if (now < ms(startsAt)) return `Starts in ${formatTimeLeft(ms(startsAt) - now)}`
  if (now < ms(endsAt)) return `In progress · ${formatTimeLeft(ms(endsAt) - now)} left`
  return null
}
