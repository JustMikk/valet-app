import type { StatusSpec } from "./presets"

/** Chip statuses used in the admin tables: tone + glyph + words (never colour alone). */
export const ADMIN_STATUS = {
  live: { tone: "ok", icon: "sensors", filled: true, label: "Live" },
  short: (open: number): StatusSpec => ({
    tone: "warn",
    icon: "error",
    filled: true,
    label: `${open} open`,
  }),
  full: { tone: "neutral", icon: "check_circle", filled: true, label: "Full" },
  draft: { tone: "neutral", icon: "edit", filled: true, label: "Draft" },
  cancelled: { tone: "neutral", icon: "block", filled: true, label: "Cancelled" },
  onShift: { tone: "ok", icon: "verified", filled: true, label: "On shift" },
  onSite: { tone: "ok", icon: "verified", filled: true, label: "On site" },
  approval: { tone: "warn", icon: "front_hand", filled: true, label: "Approval" },
  late: (min: number): StatusSpec => ({
    tone: "bad",
    icon: "running_with_errors",
    filled: true,
    label: `Late ${min}m`,
  }),
  expected: { tone: "neutral", icon: "schedule", filled: true, label: "Expected" },
  clockedOut: { tone: "muted", icon: "check_circle", filled: true, label: "Clocked out" },
  active: { tone: "ok", icon: "check_circle", filled: true, label: "Active" },
  alertsOff: { tone: "warn", icon: "notifications_off", filled: true, label: "Alerts off" },
  invited: { tone: "info", icon: "person_add", filled: true, label: "Invited" },
  inactive: { tone: "neutral", icon: "block", filled: true, label: "Inactive" },
  overdue: (days: number): StatusSpec => ({
    tone: "bad",
    icon: "error",
    filled: true,
    label: `Overdue ${days}d`,
  }),
  paid: { tone: "ok", icon: "check_circle", filled: true, label: "Paid" },
  sent: { tone: "ok", icon: "north_east", filled: true, label: "Sent" },
} as const satisfies Record<string, StatusSpec | ((n: number) => StatusSpec)>
