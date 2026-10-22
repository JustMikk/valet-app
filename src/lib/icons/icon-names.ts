// Every Material Symbols Rounded glyph the app may render. The self-hosted icon font is
// subset to exactly this list (ADR-007): after adding a name, run `pnpm icons:build`.
// icon.test.tsx fails if the committed font was built from a different list.
export const ICON_NAMES = [
  "block",
  "check_circle",
  "chevron_right",
  "close",
  "cloud_off",
  "event",
  "flag",
  "front_hand",
  "group",
  "inbox",
  "login",
  "logout",
  "menu",
  "north_east",
  "notifications",
  "notifications_off",
  "person_add",
  "running_with_errors",
  "schedule",
  "space_dashboard",
  "sync",
  "timer",
  "tune",
  "undo",
  "verified",
] as const

export type IconName = (typeof ICON_NAMES)[number]
