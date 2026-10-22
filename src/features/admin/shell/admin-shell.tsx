"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppShell, type ShellNavItem } from "@/components/shared"
import { ADMIN_USER } from "@/mocks/admin"

const LIVE: ShellNavItem = {
  key: "live",
  label: "Live Board",
  phoneLabel: "Live",
  icon: "sensors",
  href: "/admin",
  badge: { text: "2", tone: "warn" },
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
  badge: { text: "4" },
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
  badge: { text: "2" },
}
const SETTINGS: ShellNavItem = {
  key: "settings",
  label: "Settings",
  icon: "settings",
  href: "/admin/settings",
}

const SIDEBAR = [LIVE, EVENTS, STAFF, VENUES, HOURS, INVOICES, INBOX, SETTINGS]
const TABS = [LIVE, EVENTS, HOURS, INBOX]
const MORE = [STAFF, VENUES, INVOICES, SETTINGS]

const ROOTS = SIDEBAR.map((item) => item.href)

/** Which nav item a path belongs to; detail pages keep their section highlighted. */
function navKeyFor(path: string): string {
  const section = path.split("/")[2]
  return SIDEBAR.find((item) => item.key === section)?.key ?? "live"
}

/** Admin app frame: icon rail / sidebar from 700 px, floating top bar and five-tab bar on phone. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/"
  const router = useRouter()

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
      user={{ initials: ADMIN_USER.initials, name: ADMIN_USER.name, role: ADMIN_USER.role }}
      sidebarItems={SIDEBAR}
      tabItems={TABS}
      moreItems={MORE}
      currentKey={navKeyFor(pathname)}
      isRoot={ROOTS.includes(pathname)}
      // The Live Board draws its own menu and search pills on phone.
      topBar={pathname !== "/admin"}
      contentMax="max-w-290"
      onBack={goBack}
    >
      {children}
    </AppShell>
  )
}
