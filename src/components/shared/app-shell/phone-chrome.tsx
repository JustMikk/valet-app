"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { GlassPill } from "../glass-pill"
import { Icon } from "../icon"
import { ResponsiveSheet } from "../responsive-sheet"
import { TabBar } from "../tab-bar"
import { useShellMenu } from "./menu-context"
import { NotificationBell } from "./notification-bell"
import type { ShellApp, ShellLogo, ShellNavItem, ShellUser } from "./types"

const CIRCLE =
  "glass grid size-14 place-items-center rounded-pill border-0 text-fg transition-transform duration-160 active:scale-94"

type PhoneChromeProps = {
  app: ShellApp
  logo: ShellLogo
  title: string
  user: ShellUser
  tabItems: ShellNavItem[]
  /** Admin: items behind the fifth "More" tab. */
  moreItems?: ShellNavItem[]
  currentKey: string | null
  isRoot: boolean
  showTopBar: boolean
  showTabBar: boolean
  /** Unread notifications; undefined draws no bell. */
  unread?: number
  /** The avatar opens the account sheet instead of linking to Profile. */
  accountMenu?: boolean
  onBack: () => void
}

/** Floating glass top bar and tab bar for phone widths (hidden from tablet up). */
export function PhoneChrome({
  app,
  logo,
  title,
  user,
  tabItems,
  moreItems,
  currentKey,
  isRoot,
  showTopBar,
  showTabBar,
  unread,
  accountMenu,
  onBack,
}: PhoneChromeProps) {
  const { open: moreOpen, setOpen: setMoreOpen, setAccountOpen } = useShellMenu()
  const moreOn = moreItems?.some((item) => item.key === currentKey) ?? false

  const brandPill = (
    <GlassPill>
      <Image
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        className="h-7.5 w-auto"
      />
      {title}
    </GlassPill>
  )

  const tabs = tabItems.map((item) => ({
    key: item.key,
    label: item.phoneLabel ?? item.label,
    icon: item.icon,
    href: item.href,
    badge: item.badge?.text,
    badgeTone: item.badge?.tone,
  }))

  return (
    <div className="tablet:hidden">
      {showTopBar && (
        <div className="absolute top-[calc(var(--safe-top)+8px)] right-5 left-5 z-20 flex items-center justify-between">
          {isRoot ? (
            app === "admin" ? (
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMoreOpen(true)}
                className="rounded-pill border-0 bg-transparent p-0"
              >
                {brandPill}
              </button>
            ) : (
              brandPill
            )
          ) : (
            <button type="button" aria-label="Back" onClick={onBack} className={CIRCLE}>
              <Icon name="arrow_back" size={24} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            {unread !== undefined && <NotificationBell unread={unread} variant="glass" />}
            {accountMenu ? (
              <button
                type="button"
                aria-label={`Account: ${user.name}`}
                aria-haspopup="dialog"
                onClick={() => setAccountOpen(true)}
                className={cn(CIRCLE, "text-16 font-semibold")}
              >
                {user.initials}
              </button>
            ) : user.href ? (
              <Link
                href={user.href}
                aria-label={user.name}
                className={cn(CIRCLE, "text-16 font-semibold")}
              >
                {user.initials}
              </Link>
            ) : (
              <span className={cn(CIRCLE, "text-16 font-semibold")} aria-hidden="true">
                {user.initials}
              </span>
            )}
          </div>
        </div>
      )}

      {showTabBar && (
        <TabBar
          label="Main"
          size={app}
          current={moreOn ? "more" : currentKey}
          className="absolute right-4 bottom-6 left-4 z-20"
          items={[
            ...tabs,
            ...(moreItems
              ? [
                  {
                    key: "more",
                    label: "More",
                    icon: "apps" as const,
                    onSelect: () => setMoreOpen(true),
                  },
                ]
              : []),
          ]}
        />
      )}

      {moreItems && (
        <ResponsiveSheet open={moreOpen} onOpenChange={setMoreOpen} title="More" titleHidden>
          <div className="grid grid-cols-2 gap-2.5">
            {moreItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex h-24 flex-col items-start justify-between rounded-card bg-surface p-4 text-fg transition-transform duration-160 active:scale-97"
              >
                <Icon name={item.icon} filled size={28} />
                <span className="text-16 font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
          {accountMenu && (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                setAccountOpen(true)
              }}
              className="flex h-16 w-full items-center gap-3 rounded-card border-0 bg-surface px-4 text-left text-fg transition-transform duration-160 active:scale-98"
            >
              <span
                aria-hidden="true"
                className="grid size-10 flex-none place-items-center rounded-pill bg-surface-2 text-14 font-semibold"
              >
                {user.initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-16 font-semibold">{user.name}</span>
                <span className="text-13 text-fg-2">Account · switch or sign out</span>
              </span>
            </button>
          )}
        </ResponsiveSheet>
      )}
    </div>
  )
}
