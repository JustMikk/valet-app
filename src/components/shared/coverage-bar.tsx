import { cn } from "@/lib/utils"

export type CoverageCounts = {
  onSite: number
  late: number
  /** Expected and still on time. */
  expected: number
  open: number
}

type Segment = keyof CoverageCounts

// Order, words and fills per the Design System sheet ("coverage-bar").
// The legend's open swatch is outlined only; the bar segment is hatched and outlined.
const SEGMENTS: { key: Segment; words: string; fill: string; swatch: string }[] = [
  { key: "onSite", words: "on site", fill: "bg-ok", swatch: "bg-ok" },
  { key: "late", words: "late", fill: "bg-warn", swatch: "bg-warn" },
  { key: "expected", words: "expected", fill: "bg-fg-3-line", swatch: "bg-fg-3-line" },
  {
    key: "open",
    words: "open",
    fill: "hatch-open",
    swatch: "shadow-[inset_0_0_0_1.5px_var(--fg-3-line)]",
  },
]

// Counts come from live data: treat anything that is not a positive number as zero.
const wholeCount = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)
const normalise = (c: CoverageCounts): CoverageCounts => ({
  onSite: wholeCount(c.onSite),
  late: wholeCount(c.late),
  expected: wholeCount(c.expected),
  open: wholeCount(c.open),
})

const total = (counts: CoverageCounts) =>
  counts.onSite + counts.late + counts.expected + counts.open

/** "4 on site, 1 late, 1 open of 6": the bar's meaning in words. */
export function coverageSummary(input: CoverageCounts): string {
  const counts = normalise(input)
  if (total(counts) === 0) return "No slots"
  const parts = SEGMENTS.filter((s) => counts[s.key] > 0).map((s) => `${counts[s.key]} ${s.words}`)
  return `${parts.join(", ")} of ${total(counts)}`
}

type CoverageBarProps = {
  counts: CoverageCounts
  /** Show the legend under the bar. */
  legend?: boolean
  className?: string
}

/** On site + late + expected + open = headcount. Open is hatched so it reads without color. */
export function CoverageBar({ counts: input, legend = false, className }: CoverageBarProps) {
  const counts = normalise(input)
  const present = SEGMENTS.filter((s) => counts[s.key] > 0)
  const empty = present.length === 0
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div role="img" aria-label={coverageSummary(counts)} className="flex h-3.5 gap-1">
        {present.map((s) => (
          <div
            key={s.key}
            data-segment={s.key}
            className={cn("rounded-r4", s.fill)}
            // Segment widths are proportional to live counts.
            style={{ flexGrow: counts[s.key], flexBasis: 0 }}
          />
        ))}
        {empty && <div data-segment="none" className="flex-1 rounded-r4 bg-surface-2" />}
      </div>
      {legend && !empty && (
        <div aria-hidden="true" className="flex flex-wrap gap-4 text-14 font-medium text-fg-2">
          {present.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-r3", s.swatch)} />
              <b className="text-fg">{counts[s.key]}</b> {s.words}
            </span>
          ))}
          <span className="ml-auto font-semibold text-fg">of {total(counts)}</span>
        </div>
      )}
    </div>
  )
}
