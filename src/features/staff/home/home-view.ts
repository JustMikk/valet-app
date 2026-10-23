// Presentation of Home from the server's timestamps: pure, so the before / due / on-shift states
// are tested without rendering. `now` moves; the facts (opens, starts, ends, clocked in) do not.
import type { HomeShift } from "@/lib/data"
import type { StatusSpec } from "@/lib/status/presets"
import { formatClock } from "@/lib/time/duration"
import {
  deriveShiftMode,
  describeStart,
  elapsedSeconds,
  type ShiftMode,
} from "@/lib/time/shift-mode"

export type HomeView = {
  mode: ShiftMode
  status: StatusSpec
  sub: string
  heroValue: string
  /** "In 5:51 PM · scheduled until 11:00 PM" while on shift. */
  inLine: string | null
  /** 0–100 progress through the scheduled shift while on shift. */
  progress: number
  secs: number
  when: string
  ctaLabel: string
  ctaReason: string | null
}

type Overrides = {
  /** ?mode= demo link: force a state. */
  demoMode: ShiftMode | null
  /** Offline clock-in not yet confirmed by the server: show the worker on the clock. */
  pendingClockInAt: number | null
  /** Stable start for the demo on-shift state, so its timer ticks. */
  demoClockedInAt: number
}

export function buildHomeView(shift: HomeShift, now: number, overrides: Overrides): HomeView {
  const real = shift.clockedInAt ? new Date(shift.clockedInAt).getTime() : null
  const clockedInAt =
    real ??
    overrides.pendingClockInAt ??
    (overrides.demoMode === "onshift" ? overrides.demoClockedInAt : null)
  const mode =
    overrides.demoMode ??
    deriveShiftMode(
      { clockInOpensAt: shift.clockInOpensAt, endsAt: shift.endsAt, clockedInAt },
      now,
    )
  const secs = clockedInAt === null ? 0 : elapsedSeconds(clockedInAt, now)
  const scheduled = Math.max(
    1,
    (new Date(shift.endsAt).getTime() - (clockedInAt ?? new Date(shift.startsAt).getTime())) / 1000,
  )

  if (mode === "onshift") {
    return {
      mode,
      status: { tone: "ok", icon: "verified", filled: true, label: "On the clock" },
      sub:
        shift.clockedInDistanceM === null
          ? "Verified"
          : `Verified · ${shift.clockedInDistanceM} m from venue`,
      heroValue: formatClock(secs),
      inLine: `In ${shift.clockedInLabel ?? shift.startLabel} · scheduled until ${shift.endLabel}`,
      progress: Math.min(100, (secs / scheduled) * 100),
      secs,
      when: `${shift.shortAddress} · ${shift.dateLabel}`,
      ctaLabel: "Clock out",
      ctaReason: null,
    }
  }
  if (mode === "due") {
    return {
      mode,
      status: { tone: "strong", icon: "timer", filled: true, label: "Clock-in open" },
      sub: describeStart(shift.startsAt, now),
      heroValue: shift.startLabel,
      inLine: null,
      progress: 0,
      secs: 0,
      when: `${shift.dayWord === "Today" ? "Today, " : ""}${shift.whenLabel}`,
      ctaLabel: "Clock in",
      ctaReason: null,
    }
  }
  return {
    mode,
    status: { tone: "muted", icon: "event", filled: true, label: shift.dayWord },
    sub: `Clock-in opens ${shift.opensLabel}`,
    heroValue: shift.startLabel,
    inLine: null,
    progress: 0,
    secs: 0,
    when: shift.whenLabel,
    ctaLabel: `Clock in opens ${shift.opensLabel}`,
    ctaReason: `Available ${shift.windowMin} min before your shift starts`,
  }
}
