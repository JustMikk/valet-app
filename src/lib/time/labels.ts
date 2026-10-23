// Venue-local time labels (handoff §6: one module owns zone-aware formatting). Every function takes
// an instant (Date, ISO string or epoch ms) and an IANA zone, never the viewer's own zone, because
// event times are venue time. Output matches the design's strings: "Fri Oct 23", "6:00 – 11:00 PM".

export type Instant = Date | string | number

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

export type Wall = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  dow: number
}

/** The wall-clock reading in `timeZone` for an instant. */
export function wallTime(instant: Instant, timeZone: string): Wall {
  const parts = formatterFor(timeZone).formatToParts(new Date(instant))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun"
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    dow: WEEKDAYS.indexOf(weekday),
  }
}

/** The instant at which `timeZone` reads this wall-clock time (handles DST offsets). */
export function zonedInstant(
  timeZone: string,
  wall: { year: number; month: number; day: number; hour: number; minute: number },
): Date {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute)
  let guess = asUtc
  // Two passes converge across a DST boundary: shift by the zone's offset at each guess.
  for (let pass = 0; pass < 2; pass++) {
    const seen = wallTime(guess, timeZone)
    const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
    guess += asUtc - seenAsUtc
  }
  return new Date(guess)
}

/** Calendar key "2026-10-23" in the venue zone. */
export function dayKey(instant: Instant, timeZone: string): string {
  const w = wallTime(instant, timeZone)
  return `${w.year}-${String(w.month).padStart(2, "0")}-${String(w.day).padStart(2, "0")}`
}

/** Whole calendar days from `from` to `to` in the zone (0 = same day, 1 = next day). */
export function calendarDaysBetween(from: Instant, to: Instant, timeZone: string): number {
  const a = wallTime(from, timeZone)
  const b = wallTime(to, timeZone)
  const dayMs = 86_400_000
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / dayMs,
  )
}

/** "Fri Oct 23" */
export function formatDate(instant: Instant, timeZone: string): string {
  const w = wallTime(instant, timeZone)
  return `${WEEKDAYS[w.dow]} ${MONTHS[w.month - 1]} ${w.day}`
}

/** "Sat" */
export function formatWeekday(instant: Instant, timeZone: string): string {
  return WEEKDAYS[wallTime(instant, timeZone).dow]
}

/** "FRI" */
export function formatWeekdayCaps(instant: Instant, timeZone: string): string {
  return WEEKDAYS[wallTime(instant, timeZone).dow].toUpperCase()
}

/** "23" */
export function formatDayNumber(instant: Instant, timeZone: string): string {
  return String(wallTime(instant, timeZone).day)
}

function meridiem(hour: number): "AM" | "PM" {
  return hour >= 12 ? "PM" : "AM"
}

function hour12(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12
}

const minutes = (minute: number) => String(minute).padStart(2, "0")

/** "6:00 PM" */
export function formatTime(instant: Instant, timeZone: string): string {
  const w = wallTime(instant, timeZone)
  return `${hour12(w.hour)}:${minutes(w.minute)} ${meridiem(w.hour)}`
}

/** "6:00 – 11:00 PM", or "7:00 PM – 1:00 AM" when the range crosses noon or midnight. */
export function formatRange(start: Instant, end: Instant, timeZone: string): string {
  const a = wallTime(start, timeZone)
  const b = wallTime(end, timeZone)
  const full = (w: Wall) => `${hour12(w.hour)}:${minutes(w.minute)}`
  if (meridiem(a.hour) === meridiem(b.hour)) return `${full(a)} – ${full(b)} ${meridiem(b.hour)}`
  return `${full(a)} ${meridiem(a.hour)} – ${full(b)} ${meridiem(b.hour)}`
}

/** "6–11 PM", "7:30 PM – 1 AM": the short form used inside sentences. */
export function formatCompactRange(start: Instant, end: Instant, timeZone: string): string {
  const a = wallTime(start, timeZone)
  const b = wallTime(end, timeZone)
  const short = (w: Wall) =>
    w.minute === 0 ? `${hour12(w.hour)}` : `${hour12(w.hour)}:${minutes(w.minute)}`
  if (meridiem(a.hour) === meridiem(b.hour)) return `${short(a)}–${short(b)} ${meridiem(b.hour)}`
  return `${short(a)} ${meridiem(a.hour)} – ${short(b)} ${meridiem(b.hour)}`
}

/** "5h", "7h 30m", "45m" */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60_000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** "PT": the zone's generic short name, which is how the design labels venue time. */
export function formatZoneShort(instant: Instant, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortGeneric",
  }).formatToParts(new Date(instant))
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone
}

/** "Today", "Tomorrow", otherwise "Sat Oct 24". */
export function formatDayWord(instant: Instant, now: Instant, timeZone: string): string {
  const days = calendarDaysBetween(now, instant, timeZone)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return formatDate(instant, timeZone)
}

/** Notification stamp: "5:45 PM" today, weekday ("Thu") within the past week, else "Oct 12". */
export function formatStamp(instant: Instant, now: Instant, timeZone: string): string {
  const days = calendarDaysBetween(instant, now, timeZone)
  if (days <= 0) return formatTime(instant, timeZone)
  const w = wallTime(instant, timeZone)
  return days < 7 ? WEEKDAYS[w.dow] : `${MONTHS[w.month - 1]} ${w.day}`
}
