"use client"

import { PillTabs, StatusBadge } from "@/components/shared"
import { INSIGHT_RANGES, type InsightRange, type PersonInsights } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import type { StatusSpec } from "@/lib/status/presets"
import { cn } from "@/lib/utils"

export const BAND: Record<PersonInsights["score"]["band"], StatusSpec> = {
  excellent: { tone: "ok", icon: "verified", filled: true, label: "Excellent" },
  good: { tone: "ok", icon: "check_circle", filled: true, label: "Good" },
  watch: { tone: "warn", icon: "error", filled: true, label: "Watch" },
  risk: { tone: "bad", icon: "running_with_errors", filled: true, label: "At risk" },
  new: { tone: "neutral", icon: "schedule", filled: true, label: "New" },
}

const RANGE_LABEL: Record<InsightRange, string> = { 30: "30 days", 90: "90 days", 365: "12 months" }

export const CARD = "flex flex-col gap-1 rounded-r20 border border-line bg-elev px-4 py-3.5"
export const CARD_VALUE = "font-display text-24 leading-x100 font-bold tabular-nums"
export const CARD_LABEL = "text-13 font-medium text-fg-2"

/** 30 days, 90 days or 12 months: the period every number on the tab covers. */
export function RangePicker({
  value,
  onChange,
}: {
  value: InsightRange
  onChange: (range: InsightRange) => void
}) {
  return (
    <PillTabs
      label="Period"
      size="sm"
      items={INSIGHT_RANGES.map((days) => ({ value: String(days), label: RANGE_LABEL[days] }))}
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as InsightRange)}
    />
  )
}

/** The reliability score with its band and the facts behind it, so a decision can be explained. */
export function ScoreCard({ insights }: { insights: PersonInsights }) {
  const { score } = insights
  return (
    <div className="flex flex-col gap-3 rounded-r24 border border-line bg-elev p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className={CARD_LABEL}>
            Reliability · last {RANGE_LABEL[insights.rangeDays as InsightRange]}
          </span>
          <span className="font-display text-44 leading-x100 font-bold tabular-nums">
            {score.value ?? "—"}
            {score.value !== null && <span className="text-20 text-fg-3"> / 100</span>}
          </span>
        </div>
        <StatusBadge status={BAND[score.band]} />
      </div>
      <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-14 text-fg-2">
        {score.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="m-0 text-12 text-fg-3">
        On time counts 1, late 0.7, a drop with 24 h+ notice 0.8, a later drop 0.3, a no-show 0.
      </p>
    </div>
  )
}

/** The four numbers most decisions start from. */
export function KeyStats({ insights }: { insights: PersonInsights }) {
  const { stats } = insights
  const cards: [string, string, boolean?][] = [
    ["Shifts worked", String(stats.shifts)],
    ["Hours", formatHoursDecimal(stats.minutes)],
    ["Late arrivals", String(stats.late), stats.late > 0],
    ["No-shows", String(stats.noShows), stats.noShows > 0],
    ["Earned", formatMoney(stats.earnedCents)],
    ["Pending pay", formatMoney(stats.pendingCents)],
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-3">
      {cards.map(([label, value, alert]) => (
        <div key={label} className={CARD}>
          <span className={cn(CARD_VALUE, alert && "text-bad")}>{value}</span>
          <span className={CARD_LABEL}>{label}</span>
        </div>
      ))}
    </div>
  )
}
