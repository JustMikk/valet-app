import type { IconName } from "@/lib/icons/icon-names"

export type StatusTone =
  | "ok"
  | "warn"
  | "info"
  | "bad"
  | "bad-solid"
  | "strong"
  | "neutral"
  | "muted"
  | "faint"
  | "outline"

/** How a status reads: tone, glyph and words together (Design System rule: never color alone). */
export type StatusSpec = {
  tone: StatusTone
  icon: IconName
  /** Outline glyphs mark "absent" states (open slot, dropped); the rest are filled. */
  filled: boolean
  label: string
}

/** Slot and health states from the Design System sheet ("status-badge"), in the sheet's order. */
export const STATUS = {
  onSite: { tone: "ok", icon: "verified", filled: true, label: "On site" },
  flaggedQueued: { tone: "warn", icon: "flag", filled: true, label: "Flagged · queued" },
  expected: { tone: "neutral", icon: "schedule", filled: true, label: "Expected" },
  dueNow: { tone: "strong", icon: "timer", filled: true, label: "Due now" },
  late: (minutes: number): StatusSpec => ({
    tone: "warn",
    icon: "running_with_errors",
    filled: true,
    label: `Late ${Math.round(minutes)} min`,
  }),
  waitingApproval: { tone: "info", icon: "front_hand", filled: true, label: "Waiting approval" },
  openSlot: { tone: "outline", icon: "person_add", filled: false, label: "Open slot" },
  clockedOut: { tone: "muted", icon: "check_circle", filled: true, label: "Clocked out" },
  missingClockOut: { tone: "bad", icon: "logout", filled: true, label: "Missing clock-out" },
  noShow: { tone: "bad-solid", icon: "block", filled: true, label: "No-show" },
  dropped: { tone: "faint", icon: "undo", filled: false, label: "Dropped" },
  pushOff: { tone: "muted", icon: "notifications_off", filled: true, label: "Push off" },
} as const satisfies Record<string, StatusSpec | ((minutes: number) => StatusSpec)>
