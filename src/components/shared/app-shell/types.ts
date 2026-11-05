import type { ReactNode } from "react"

import type { IconName } from "@/lib/icons/icon-names"

export type ShellApp = "staff" | "admin"

/** The tenant mark; width and height are its intrinsic size, so the box keeps its shape while loading. */
export type ShellLogo = { src: string; alt: string; width: number; height: number }

export type ShellBadge = { text: string; tone?: "fg" | "warn" | "bad" }

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

export type ShellNotifications = {
  /** Unread count: drives the bell's dot and the sidebar badge. */
  unread: number
  /** Called each time the drawer closes, however it was dismissed (the app marks things read). */
  onClose?: () => void
  /** The drawer's content: the app's list and its push prompt. */
  children: ReactNode
}

export type ShellAccount = {
  /** Ends the session and returns to the landing page. */
  onSignOut: () => void
  /** Ends the session and opens the sign-in page, so someone else can sign in. */
  onSwitch: () => void
}
