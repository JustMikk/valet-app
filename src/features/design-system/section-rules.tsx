import { Mono, SectionTitle, SheetPanel } from "./primitives"

/** Section 06 — Do / Don't. */
export function SectionRules() {
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>06 — RULES</SectionTitle>
      <div className="grid grid-cols-2 gap-4 text-15 leading-x150">
        <SheetPanel className="gap-2 rounded-r20 p-5.5">
          <strong className="font-semibold">Do</strong>
          <span className="text-fg-2">
            Use inline <Mono>var(--token)</Mono> values only · keep one accent action per view ·
            pair every status color with icon + words · show &ldquo;venue time · PT&rdquo; where
            ambiguous · keep primary staff actions in the bottom 40% of the screen.
          </span>
        </SheetPanel>
        <SheetPanel className="gap-2 rounded-r20 p-5.5">
          <strong className="font-semibold">Don&apos;t</strong>
          <span className="text-fg-2">
            Use gold for status · show moving dots or &ldquo;last seen&rdquo; · hide unavailable
            actions (disable + explain instead) · show bill rates on any staff surface · rely on
            hover for anything.
          </span>
        </SheetPanel>
      </div>
    </section>
  )
}
