import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist_Mono, Onest } from "next/font/google"
import localFont from "next/font/local"

// Direct import: the @/lib/theme barrel also exports the client hook, which would ship to
// every route.
import { ThemeScript } from "@/lib/theme/theme-script"
import { cn } from "@/lib/utils"

import "./globals.css"

// Display: Bricolage Grotesque with its optical-size axis, as the design export loads it.
// Not preloaded on every route (75 KiB): it swaps in; routes whose LCP is a display number
// can preload it themselves (CONSTRAINTS.md performance budget).
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  preload: false,
})

// UI and body text.
const onest = Onest({ subsets: ["latin"], variable: "--font-onest" })

// Numbers, codes, timers.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", preload: false })

// Material Symbols Rounded, subset to src/lib/icons/icon-names.ts (ADR-007).
// `block` keeps ligature names from flashing as text before the glyphs load. Not preloaded
// (81 KiB): it loads when a page first shows an icon, so the landing page, which shows none at
// first paint, meets its LCP budget (owner, 2026-11-26; amends ADR-009).
const materialSymbols = localFont({
  src: "../fonts/material-symbols-rounded.woff2",
  weight: "400 700",
  display: "block",
  variable: "--font-material-symbols",
  preload: false,
})

export const metadata: Metadata = {
  title: "Valet Workforce",
  // Installing to the home screen is what lets iOS deliver push (ADR-015).
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script sets data-theme on <html> before hydration.
      suppressHydrationWarning
      className={cn(
        "h-full",
        bricolage.variable,
        onest.variable,
        geistMono.variable,
        materialSymbols.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  )
}
