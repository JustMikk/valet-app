"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Icon } from "../icon"
import { PhoneChrome } from "./phone-chrome"
import { Sidebar } from "./sidebar"
import type { ShellApp, ShellNavItem, ShellUser } from "./types"

type AppShellProps = {
  app: ShellApp
  logo: { src: string; alt: string }
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
  /** Width class of the wide-screen Back row, matching the page's content width. */
  contentMax?: string
  onBack: () => void
  children: ReactNode
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
  contentMax = "max-w-280",
  onBack,
  children,
}: AppShellProps) {
  const layered = mode !== "app"

  return (
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
        />
      )}

      <main className="relative h-full min-w-0 flex-1">
        {layered ? (
          <div className="absolute inset-0 z-50">{children}</div>
        ) : (
          <div className="no-scrollbar h-full overflow-y-auto">
            {!isRoot && (
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
            )}
            {children}
          </div>
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
            onBack={onBack}
          />
        )}
      </main>
    </div>
  )
}
