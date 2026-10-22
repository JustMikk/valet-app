"use client"

import { useState } from "react"

import { DEFAULT_ACCENT, TenantTheme } from "@/lib/tenant"

import { SectionComponents } from "./section-components"
import { SectionFoundations } from "./section-foundations"
import { SectionIntro } from "./section-intro"
import { SectionRules } from "./section-rules"
import { SectionTokens } from "./section-tokens"

/**
 * Living reference of Design System.dc.html: the same 1320 px sheet, built only from the
 * design tokens and shared components. The sheet itself is light; section 05 shows both themes.
 */
export function DesignSystemShowcase() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT)

  return (
    <div data-theme="light" className="min-h-screen bg-canvas text-fg">
      <TenantTheme accent={accent} />
      <main className="box-border flex w-330 flex-col gap-18 px-18 pt-16 pb-24">
        <SectionIntro accent={accent} onAccentChange={setAccent} />
        <SectionTokens accent={accent} />
        <SectionFoundations />
        <SectionComponents />
        <SectionRules />
      </main>
    </div>
  )
}
