import { cn } from "@/lib/utils"

import { Mono, SectionTitle, SheetPanel } from "./primitives"

// Type scale rows (sheet section 03), set in the app font: Prompt throughout, as on the
// Regency website; numbers use its tabular figures.
const TYPE_ROWS = [
  {
    meta: ["display", "56/56 · 700 · -3.5%"],
    sample: "6:00 PM",
    className: "font-display text-56 leading-x100 font-bold tracking-n035 tabular-nums",
  },
  {
    meta: ["title-1", "32/36 · 700 · -3%"],
    sample: "The Grand Hotel",
    className: "font-display text-32 leading-9 font-bold tracking-n030",
  },
  {
    meta: ["title-2", "22/28 · 600 · -2%"],
    sample: "Needs you now",
    className: "font-display text-22 leading-7 font-semibold tracking-n020",
  },
  {
    meta: ["tab / label-lg", "19/24 · 600"],
    sample: "Events",
    className: "text-19 leading-6 font-semibold",
  },
  {
    meta: ["body", "17/24 · 400"],
    sample: "Park in the east lot. Ask for Priya at the front desk.",
    className: "text-17 leading-6",
  },
  {
    meta: ["label", "15/20 · 500"],
    sample: "Clock-in opens 5:45 PM",
    className: "text-15 leading-5 font-medium",
  },
  {
    meta: ["caption", "13/18 · 500"],
    sample: "Times shown in venue time · PT",
    className: "text-13 leading-4.5 font-medium text-fg-2",
  },
  {
    meta: ["mono / timer", "Prompt 600 · tabular"],
    sample: "02:14:07",
    className: "font-mono text-28 leading-x100 font-semibold tracking-n020",
  },
] as const

const SPACING = [4, 8, 12, 16, 20, 24, 32, 48] as const
const RADII = [
  { label: "10 chip", className: "w-13 rounded-chip" },
  { label: "16 field", className: "w-13 rounded-field" },
  { label: "22 card", className: "w-13 rounded-card" },
  { label: "28 sheet", className: "w-13 rounded-t-r28 rounded-b-none" },
  { label: "pill", className: "w-18 rounded-pill" },
] as const
const ELEVATION = [
  { label: "0 · line", className: "border border-line" },
  { label: "1 · float", className: "shadow-float" },
  { label: "2 · sheet", className: "shadow-sheet" },
] as const

const META = "font-mono text-12 leading-x130 font-medium text-fg-3"
const SUBHEAD = "text-13 leading-x100 font-semibold"
const NOTE = "text-13 leading-x140 text-fg-2"

/** Sections 03 — Type scale and 04 — Space · Radius · Elevation, side by side. */
export function SectionFoundations() {
  return (
    <section className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
      <div className="flex flex-col gap-6">
        <SectionTitle>03 — TYPE SCALE (MOBILE)</SectionTitle>
        <SheetPanel className="gap-5.5 rounded-r24 p-7">
          {TYPE_ROWS.map((row) => (
            <div key={row.meta[0]} className="grid grid-cols-[140px_1fr] items-baseline gap-4">
              <span className={META}>
                {row.meta[0]}
                <br />
                {row.meta[1]}
              </span>
              <span className={row.className}>{row.sample}</span>
            </div>
          ))}
        </SheetPanel>
        <p className="m-0 text-14 leading-x150 text-fg-2">
          Numbers always use tabular figures. Desktop steps display to 64 and title-1 to 36;
          everything else holds. Never set staff-facing text below 15 px.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <SectionTitle>04 — SPACE · RADIUS · ELEVATION</SectionTitle>
        <SheetPanel className="gap-6.5 rounded-r24 p-7">
          <div className="flex flex-col gap-2.5">
            <span className={SUBHEAD}>Spacing (4-pt)</span>
            <div className="flex items-end gap-3">
              {SPACING.map((px) => (
                <div key={px} className="flex flex-col items-center gap-1.5">
                  {/* Each square is drawn at its own spacing value. */}
                  <div
                    className={px === 20 ? "bg-accent" : "bg-fg"}
                    style={{ width: px, height: px }}
                  />
                  <span className="font-mono text-11 font-medium text-fg-3">{px}</span>
                </div>
              ))}
            </div>
            <span className={NOTE}>
              20 = screen gutter (gold). 32 between sections, 12–16 inside cards.
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={SUBHEAD}>Radius</span>
            <div className="flex items-end gap-3">
              {RADII.map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-1.5">
                  <div className={cn("h-10 border border-line bg-surface", r.className)} />
                  <span className="font-mono text-11 font-medium text-fg-3">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={SUBHEAD}>Elevation</span>
            <div className="flex gap-4 py-2">
              {ELEVATION.map((e) => (
                <div
                  key={e.label}
                  className={cn(
                    "grid h-14 flex-1 place-items-center rounded-pill bg-bg font-mono text-12 font-medium text-fg-2",
                    e.className,
                  )}
                >
                  {e.label}
                </div>
              ))}
            </div>
            <span className={NOTE}>
              Only floating chrome and sheets cast shadows. Lists separate with hairlines, cards
              with <Mono>--surface</Mono>.
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={SUBHEAD}>Layout</span>
            <span className={cn(NOTE, "leading-x150")}>
              Phone &lt; 700: single column, 20 gutter, floating tab bar. Tablet 700–1099: 84 icon
              rail, 32 gutter. Desktop ≥ 1100: 248 sidebar + fluid content. Motion: 180 ms ease-out
              for state, 320 ms spring for sheets; live updates fade in, never reorder under a
              finger.
            </span>
          </div>
        </SheetPanel>
      </div>
    </section>
  )
}
