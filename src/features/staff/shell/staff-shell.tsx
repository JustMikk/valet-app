"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { signOut } from "@/lib/data"
import { AppShell, PwaInstallBanner, type ShellNavItem } from "@/components/shared"

import { useNotificationChime } from "@/lib/platform/use-notification-chime"

import { useHome, useMarkNotificationsRead, useNotifications, useProfile } from "../data/queries"
import { NotificationPanel } from "./notification-panel"
import { BRAND_CREST } from "@/lib/brand"

/** Home, Shifts, Open (with a count of claimable shifts) and Inbox. */
const navItems = (openCount: number): ShellNavItem[] => [
  { key: "home", label: "Home", icon: "home", href: "/staff" },
  { key: "shifts", label: "Shifts", icon: "calendar_month", href: "/staff/shifts" },
  {
    key: "open",
    label: "Open",
    icon: "add_circle",
    href: "/staff/open",
    ...(openCount > 0 ? { badge: { text: String(openCount) } } : {}),
  },
  { key: "inbox", label: "Inbox", icon: "chat_bubble", href: "/staff/inbox" },
]

const ROOTS = ["/staff", "/staff/shifts", "/staff/open", "/staff/inbox"]

/** Which nav item a path belongs to (Profile highlights nothing, as in the design). */
function navKeyFor(path: string): string | null {
  if (path === "/staff") return "home"
  if (path.startsWith("/staff/shifts")) return "shifts"
  if (path.startsWith("/staff/open")) return "open"
  if (path === "/staff/inbox" || path === "/staff/notifications") return "inbox"
  return null
}

/** Staff app frame: icon rail / sidebar from 700 px, floating top bar and tab bar on phone. */
export function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/"
  const router = useRouter()
  const profile = useProfile().data
  const nav = navItems(useHome().data?.open.count ?? 0)
  const unread = useNotifications().data?.unread ?? 0
  useNotificationChime(unread)
  const markRead = useMarkNotificationsRead()

  const mode =
    pathname === "/staff/onboarding" ? "bare" : pathname === "/staff/clock" ? "overlay" : "app"

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push("/staff")
  }

  return (
    <AppShell
      app="staff"
      logo={{ ...BRAND_CREST, alt: "Regency" }}
      brand={{ title: "Regency" }}
      phoneTitle="Regency"
      user={{
        initials: profile?.initials ?? "",
        name: profile?.name ?? "",
        role: profile?.role ?? "",
        href: "/staff/profile",
      }}
      sidebarItems={nav}
      tabItems={nav}
      currentKey={navKeyFor(pathname)}
      isRoot={ROOTS.includes(pathname)}
      mode={mode}
      contentMax="max-w-280"
      notifications={{
        unread,
        // Closing the drawer is what reads them, so the dots stay while you look.
        onClose: () => {
          if (unread > 0) markRead.mutate()
        },
        children: <NotificationPanel />,
      }}
      account={{
        onSignOut: () => {
          signOut("staff")
          router.push("/")
        },
        onSwitch: () => {
          signOut("staff")
          router.push("/login?role=staff")
        },
      }}
      banner={<PwaInstallBanner />}
      onBack={goBack}
    >
      {children}
    </AppShell>
  )
}
