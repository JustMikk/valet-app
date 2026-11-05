"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Icon } from "../icon"
import { ShellMenuProvider, useShellMenu } from "./menu-context"
import { AccountSheet } from "./account-sheet"
import { NotificationDrawer } from "./notification-drawer"
import { PhoneChrome } from "./phone-chrome"
import { RouteScreen } from "./route-screen"
import { Sidebar } from "./sidebar"
import type {
  ShellAccount,
  ShellApp,
  ShellLogo,
  ShellNavItem,
  ShellNotifications,
  ShellUser,
} from "./types"

type AppShellProps = {
  app: ShellApp
  logo: ShellLogo
  /** Desktop sidebar brand block. */
  brand: { title: string; subtitle?: string }
  /** Phone top-bar title. */
  phoneTitle: string
  user: ShellUser
  /** Every destination, shown in the tablet rail and desktop sidebar. */
  sidebarItems: ShellNavItem[]
  /** Destinations on the phone tab bar. */
  tabItems: ShellNavItem[]
  /** Admin: the rest, behind a fifth "More" tab. */
  moreItems?: ShellNavItem[]
  currentKey: string | null
  /** Root pages show the brand in the top bar; child pages show Back. */
  isRoot: boolean
  /**
   * `app`: full chrome. `overlay`: a full-screen layer over the app (clock-in) — sidebar kept on
   * wide screens, phone chrome hidden. `bare`: nothing but the layer (onboarding).
   */
  mode?: "app" | "overlay" | "bare"
  /** Hide the floating phone top bar (the Live Board draws its own). */
  topBar?: boolean
  /** Hide the phone tab bar on focused pages whose actions pin to the bottom instead. */
  tabBar?: boolean
  /** Wide screens: a top bar drawn above every page in place of the Back row (it brings its own). */
  pageBar?: ReactNode
  /** Width class of the wide-screen Back row, matching the page's content width. */
  contentMax?: string
  /** The bell and its drawer. Left out, the shell draws neither. */
  notifications?: ShellNotifications
  /** Switch account and sign out, from the avatar. Left out, the avatar keeps its old behaviour. */
  account?: ShellAccount
  /** Optional banner rendered above the scrollable content area (e.g. PWA install prompt). */
  banner?: ReactNode
  onBack: () => void
  children: ReactNode
}

/** The drawer, wired to the shell's open state; tells the app each time it closes. */
function NotificationsLayer({ notifications }: { notifications: ShellNotifications }) {
  const { notificationsOpen, setNotificationsOpen } = useShellMenu()
  const wasOpen = useRef(false)
  const { onClose } = notifications

  useEffect(() => {
    if (wasOpen.current && !notificationsOpen) onClose?.()
    wasOpen.current = notificationsOpen
  }, [notificationsOpen, onClose])

  return (
    <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      {notifications.children}
    </NotificationDrawer>
  )
}

/**
 * Responsive app frame shared by the staff and admin apps: tenant-glow ground, icon rail /
 * sidebar from 700 px, floating top bar and tab bar below it. Layout switches in CSS
 * (tablet:/desktop:), so the first paint is right at every width.
 */
export function AppShell({
  app,
  logo,
  brand,
  phoneTitle,
  user,
  sidebarItems,
  tabItems,
  moreItems,
  currentKey,
  isRoot,
  mode = "app",
  topBar = true,
  tabBar = true,
  pageBar,
  contentMax = "max-w-280",
  notifications,
  account,
  banner,
  onBack,
  children,
}: AppShellProps) {
  const layered = mode !== "app"

  return (
    <ShellMenuProvider>
      <div
        data-app={app}
        className="relative flex h-dvh overflow-hidden bg-bg font-sans text-fg antialiased"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ambient" />

        {mode !== "bare" && (
          <Sidebar
            app={app}
            logo={logo}
            brand={brand}
            items={sidebarItems}
            currentKey={currentKey}
            user={user}
            unread={notifications?.unread}
            accountMenu={Boolean(account)}
          />
        )}

        <main className="relative flex h-full min-w-0 flex-1 flex-col">
          {banner && mode === "app" && (
            // On phone the floating top bar covers the very top of <main>, so push the banner
            // down to clear it. Tablet+ has a sidebar; the floating chrome is hidden, so no pad.
            <div className="pt-[calc(var(--safe-top)+72px)] tablet:pt-0">{banner}</div>
          )}
          {layered ? (
            <div className="absolute inset-0 z-50">{children}</div>
          ) : (
            <RouteScreen
              back={
                pageBar ??
                (!isRoot && (
                  <div
                    className={cn(
                      "mx-auto box-border hidden w-full px-8 pt-6 tablet:block desktop:px-12 desktop:pt-7",
                      contentMax,
                    )}
                  >
                    <button
                      type="button"
                      onClick={onBack}
                      className="inline-flex h-11 items-center gap-1 rounded-pill border-0 glass pr-4 pl-2.5 text-15 font-semibold text-fg"
                    >
                      <Icon name="arrow_back" size={22} />
                      Back
                    </button>
                  </div>
                ))
              }
            >
              {children}
            </RouteScreen>
          )}

          {mode === "app" && (
            <PhoneChrome
              app={app}
              logo={logo}
              title={phoneTitle}
              user={user}
              tabItems={tabItems}
              moreItems={moreItems}
              currentKey={currentKey}
              isRoot={isRoot}
              showTopBar={topBar}
              showTabBar={tabBar}
              unread={notifications?.unread}
              accountMenu={Boolean(account)}
              onBack={onBack}
            />
          )}
        </main>
        {notifications && mode === "app" && <NotificationsLayer notifications={notifications} />}
        {account && mode === "app" && <AccountSheet user={user} account={account} />}
      </div>
    </ShellMenuProvider>
  )
}
