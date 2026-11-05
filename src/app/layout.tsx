import type { Metadata } from "next"
import { Prompt } from "next/font/google"
import localFont from "next/font/local"

// Direct import: the @/lib/theme barrel also exports the client hook, which would ship to
// every route.
import { ThemeScript } from "@/lib/theme/theme-script"
import { cn } from "@/lib/utils"

import "./globals.css"

// Prompt, the Regency website's typeface, for everything: display, UI text and numbers
// (numbers use tabular figures, see globals.css). Static font, so one file per weight.
const prompt = Prompt({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
})

// Material Symbols Rounded, subset to src/lib/icons/icon-names.ts (ADR-007).
// `block` keeps ligature names from flashing as text before the glyphs load.
const materialSymbols = localFont({
  src: "../fonts/material-symbols-rounded.woff2",
  weight: "400 700",
  display: "block",
  variable: "--font-material-symbols",
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
      className={cn("h-full", prompt.variable, materialSymbols.variable)}
    >
      <body className="flex min-h-full flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  )
}
