import { SectionTitle } from "./primitives"
import { CompositeSpecimens } from "./specimens-composite"
import { CoreSpecimens } from "./specimens-core"

const THEMES = [
  { mode: "light", label: "LIGHT" },
  { mode: "dark", label: "DARK" },
] as const

/** Section 05 — every component rendered in a light and a dark theme scope, side by side. */
export function SectionComponents() {
  return (
    <section className="flex flex-col gap-6">
      <SectionTitle>05 — COMPONENTS · LIGHT / DARK</SectionTitle>
      <div className="flex items-start gap-6">
        {THEMES.map((theme) => (
          <div
            key={theme.mode}
            data-theme={theme.mode}
            className="box-border flex w-155 shrink-0 flex-col gap-10 rounded-r32 bg-bg px-7 py-8 text-fg"
          >
            <span className="font-mono text-12 leading-x100 font-semibold tracking-p060 text-fg-3">
              {theme.label}
            </span>
            <CoreSpecimens />
            <CompositeSpecimens />
          </div>
        ))}
      </div>
    </section>
  )
}
