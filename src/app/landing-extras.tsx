"use client"

import dynamic from "next/dynamic"

// The landing page's theme toggle and install banner load after the page shows: with them, the
// first load carried 47 kB more JS (class merging, theme validation) and missed the Lighthouse
// LCP budget (CONSTRAINTS.md). The placeholder keeps the toggle's space, so nothing shifts.
export const LandingThemeToggle = dynamic(
  () => import("@/components/shared/theme-toggle").then((m) => m.ThemeToggle),
  { ssr: false, loading: () => <span aria-hidden className="size-11 flex-none" /> },
)

export const LandingInstallBanner = dynamic(
  () => import("@/components/shared/pwa-install-banner").then((m) => m.PwaInstallBanner),
  { ssr: false },
)
