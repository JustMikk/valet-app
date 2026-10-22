"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppShell, type ShellNavItem } from "@/components/shared"
import { STAFF_USER } from "@/mocks/staff"

const NAV: ShellNavItem[] = [
  { key: "home", label: "Home", icon: "home", href: "/staff" },
  { key: "shifts", label: "Shifts", icon: "calendar_month", href: "/staff/shifts" },
  { key: "open", label: "Open", icon: "add_circle", href: "/staff/open", badge: { text: "4" } },
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

  const mode =
    pathname === "/staff/onboarding" ? "bare" : pathname === "/staff/clock" ? "overlay" : "app"

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push("/staff")
  }

  return (
    <AppShell
      app="staff"
      logo={{ src: "/brand/regency-logo.png", alt: "Regency" }}
      brand={{ title: "Regency" }}
      phoneTitle="Regency"
      user={{
        initials: STAFF_USER.initials,
        name: STAFF_USER.name,
        role: STAFF_USER.role,
        href: "/staff/profile",
      }}
      sidebarItems={NAV}
      tabItems={NAV}
      currentKey={navKeyFor(pathname)}
      isRoot={ROOTS.includes(pathname)}
      mode={mode}
      contentMax="max-w-280"
      onBack={goBack}
    >
      {children}
    </AppShell>
  )
}
