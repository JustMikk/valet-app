import Image from "next/image"

import { AccentSwitcher } from "./accent-switcher"
import { SectionTitle, SheetPanel } from "./primitives"
import { BRAND_LOGO } from "@/lib/brand"

const SPECS = [
  ["Type", "Prompt (display, UI and numbers)"],
  ["Icons", "Material Symbols Rounded, filled"],
  ["Grid", "4 pt · 20 px mobile gutter"],
  ["Targets", "48 px min · 56 px primary"],
] as const

const PRINCIPLES = [
  [
    "One big number",
    "Each screen leads with the single fact that matters: start time, time on shift, people needing you.",
  ],
  [
    "Color = meaning",
    "Surfaces stay black and white. Green, orange, red and blue only ever describe status — always paired with an icon and words.",
  ],
  [
    "Gold = act",
    "The tenant accent marks the one primary action per view. Never decoration, never status.",
  ],
  [
    "Floating chrome",
    "Top bar and tab bar are elevated pills; content scrolls beneath. Actions live in the thumb zone.",
  ],
  [
    "Honest time",
    "Relative time first (“late 12 min”), venue-local clock second. Location is a punch snapshot, never “live”.",
  ],
] as const

type IntroProps = { accent: string; onAccentChange: (hex: string) => void }

/** Sheet header and section 01 — Principles. */
export function SectionIntro({ accent, onAccentChange }: IntroProps) {
  return (
    <>
      <header className="flex items-end justify-between gap-10">
        <div className="flex max-w-190 flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO.src}
              alt="Regency Parking Service"
              width={BRAND_LOGO.width}
              height={BRAND_LOGO.height}
              className="h-11 w-auto"
              priority
            />
            <span className="font-mono text-13 leading-x100 font-medium tracking-p040 text-fg-2">
              VALET WORKFORCE · DESIGN SYSTEM v0.1
            </span>
          </div>
          <h1 className="m-0 font-display text-64 leading-x100 font-bold tracking-n035">
            Calm by default.
            <br />
            Loud when it matters.
          </h1>
          <p className="m-0 text-19 leading-x145 text-pretty text-fg-2">
            Derived from the reference: monochrome surfaces, one oversized number per screen,
            floating pill chrome, and color reserved for meaning. Built mobile-first for staff
            outdoors and admins on the move. Every token below exists in light and dark; the accent
            is tenant-swappable (Regency gold by default).
          </p>
        </div>
        <div className="flex flex-col items-end gap-5">
          <dl className="m-0 grid grid-cols-[auto_auto] gap-x-7 gap-y-2.5 text-14 leading-x140 text-fg-2">
            {SPECS.map(([term, value]) => (
              <div key={term} className="contents">
                <dt className="font-semibold text-fg">{term}</dt>
                <dd className="m-0">{value}</dd>
              </div>
            ))}
          </dl>
          <AccentSwitcher value={accent} onChange={onAccentChange} />
        </div>
      </header>

      <section className="flex flex-col gap-6">
        <SectionTitle>01 — PRINCIPLES</SectionTitle>
        <div className="grid grid-cols-5 gap-4">
          {PRINCIPLES.map(([title, body], i) => (
            <SheetPanel key={title} className="gap-2.5 rounded-r20 p-5.5">
              <span className="font-display text-32 leading-x100 font-bold tracking-n030">
                {i + 1}
              </span>
              <strong className="text-17 leading-x130 font-semibold">{title}</strong>
              <span className="text-14 leading-x145 text-fg-2">{body}</span>
            </SheetPanel>
          ))}
        </div>
      </section>
    </>
  )
}
