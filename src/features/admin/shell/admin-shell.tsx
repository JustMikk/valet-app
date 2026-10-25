"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { signOut } from "@/lib/data"
import { AppShell, PwaInstallBanner, type ShellNavItem } from "@/components/shared"

import { useNotificationChime } from "@/lib/platform/use-notification-chime"

import { useMarkNotificationsRead, useNotifications, useSession } from "../data/queries"
import { NotificationPanel } from "./notification-panel"

type Badges = { live: number; hours: number; inbox: number }

const count = (n: number) => (n > 0 ? { text: String(n) } : undefined)

/** The eight sections; badges are what needs the dispatcher right now. */
function navItems(badges: Badges) {
  const LIVE: ShellNavItem = {
    key: "live",
    label: "Live Board",
    phoneLabel: "Live",
    icon: "sensors",
    href: "/admin",
    badge: badges.live > 0 ? { text: String(badges.live), tone: "warn" } : undefined,
  }
  const EVENTS: ShellNavItem = {
    key: "events",
    label: "Events",
    icon: "event",
    href: "/admin/events",
  }
  const STAFF: ShellNavItem = { key: "staff", label: "Staff", icon: "group", href: "/admin/staff" }
  const VENUES: ShellNavItem = {
    key: "venues",
    label: "Venues",
    icon: "location_on",
    href: "/admin/venues",
  }
  const HOURS: ShellNavItem = {
    key: "hours",
    label: "Hours",
    icon: "schedule",
    href: "/admin/hours",
    badge: count(badges.hours),
  }
  const INVOICES: ShellNavItem = {
    key: "invoices",
    label: "Invoices",
    icon: "receipt_long",
    href: "/admin/invoices",
  }
  const INBOX: ShellNavItem = {
    key: "inbox",
    label: "Inbox",
    icon: "chat_bubble",
    href: "/admin/inbox",
    badge: count(badges.inbox),
  }
  const SETTINGS: ShellNavItem = {
    key: "settings",
    label: "Settings",
    icon: "settings",
    href: "/admin/settings",
  }
  return {
    sidebar: [LIVE, EVENTS, STAFF, VENUES, HOURS, INVOICES, INBOX, SETTINGS],
    tabs: [LIVE, EVENTS, HOURS, INBOX],
    more: [STAFF, VENUES, INVOICES, SETTINGS],
  }
}

/** Which nav item a path belongs to; detail pages keep their section highlighted. */
function navKeyFor(path: string, keys: string[]): string {
  const section = path.split("/")[2]
  return keys.find((key) => key === section) ?? "live"
}

/** Admin app frame: icon rail / sidebar from 700 px, floating top bar and five-tab bar on phone. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/"
  const router = useRouter()
  const session = useSession().data
  const unread = useNotifications().data?.unread ?? 0
  useNotificationChime(unread)
  const markRead = useMarkNotificationsRead()
  const nav = navItems(session?.badges ?? { live: 0, hours: 0, inbox: 0 })
  const roots = nav.sidebar.map((item) => item.href)

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push("/admin")
  }

  return (
    <AppShell
      app="admin"
      logo={{ src: "/brand/regency-logo.png", alt: "Regency" }}
      brand={{ title: "Regency", subtitle: "Dispatch" }}
      phoneTitle="Dispatch"
      user={{
        initials: session?.admin.initials ?? "",
        name: session?.admin.name ?? "",
        role: session?.admin.role ?? "",
      }}
      sidebarItems={nav.sidebar}
      tabItems={nav.tabs}
      moreItems={nav.more}
      currentKey={navKeyFor(
        pathname,
        nav.sidebar.map((item) => item.key),
      )}
      isRoot={roots.includes(pathname)}
      // The Live Board draws its own menu and search pills on phone.
      topBar={pathname !== "/admin"}
      contentMax="max-w-290"
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
          signOut("admin")
          router.push("/")
        },
        onSwitch: () => {
          signOut("admin")
          router.push("/login?role=admin")
        },
      }}
      banner={<PwaInstallBanner />}
      onBack={goBack}
    >
      {children}
    </AppShell>
  )
}
