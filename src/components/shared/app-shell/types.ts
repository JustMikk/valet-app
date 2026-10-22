import type { IconName } from "@/lib/icons/icon-names"

export type ShellApp = "staff" | "admin"

export type ShellBadge = { text: string; tone?: "fg" | "warn" }

export type ShellNavItem = {
  key: string
  label: string
  /** Shorter label for the phone tab bar ("Live" for "Live Board"). */
  phoneLabel?: string
  icon: IconName
  href: string
  badge?: ShellBadge
}

export type ShellUser = {
  initials: string
  name: string
  role: string
  /** Makes the avatar a link (staff: Profile). */
  href?: string
}
