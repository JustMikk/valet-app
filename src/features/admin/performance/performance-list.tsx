"use client"

import { useState } from "react"
import Link from "next/link"

import { Icon, PersonAvatar, PillTabs, StatusBadge } from "@/components/shared"
import type { InsightRange, TeamPerformanceRow } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { TABLE_CARD } from "../common/data-table"
import { useTeamPerformance } from "../data/person-queries"
import { QueryState } from "../data/query-state"
import { BAND, CARD, CARD_LABEL, CARD_VALUE, RangePicker } from "./insight-parts"

type View = "all" | "attention" | "excellent" | "new"
const VIEWS: { value: View; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Needs attention" },
  { value: "excellent", label: "Excellent" },
  { value: "new", label: "New" },
]

const GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 tablet:grid-cols-[minmax(0,1.6fr)_8.5rem_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] tablet:gap-4"

const inView = (row: TeamPerformanceRow, view: View) =>
  view === "all" ||
  (view === "attention" && (row.band === "watch" || row.band === "risk")) ||
  row.band === view

/** Every valet's reliability and attendance side by side; each row opens their own page. */
export function PerformanceList() {
  const [days, setDays] = useState<InsightRange>(90)
  const team = useTeamPerformance(days)
  return (
    <AdminPage>
      <AdminHead
        title="Performance"
        sub="Reliability, attendance and activity for every valet"
        tools={<RangePicker value={days} onChange={setDays} />}
      />
      <div className="tablet:hidden">
        <RangePicker value={days} onChange={setDays} />
      </div>
      <QueryState query={team} rows={5}>
        {(rows) => <TeamTable rows={rows} />}
      </QueryState>
    </AdminPage>
  )
}

function TeamTable({ rows }: { rows: TeamPerformanceRow[] }) {
  const [view, setView] = useState<View>("all")
  const scored = rows.filter((row) => row.score !== null)
  const attention = rows.filter((row) => inView(row, "attention"))
  // Needs attention shows the lowest scores first; everything else, the best first.
  const shown = rows
    .filter((row) => inView(row, view))
    .sort((a, b) =>
      view === "attention" ? (a.score ?? 0) - (b.score ?? 0) : (b.score ?? -1) - (a.score ?? -1),
    )
  const cards: [string, string, boolean?][] = [
    [
      "Average reliability",
      scored.length
        ? String(Math.round(scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length))
        : "—",
    ],
    ["Need attention", String(attention.length), attention.length > 0],
    ["No-shows", String(rows.reduce((sum, row) => sum + row.noShows, 0))],
    ["Late arrivals", String(rows.reduce((sum, row) => sum + row.late, 0))],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-4">
        {cards.map(([label, value, alert]) => (
          <div key={label} className={CARD}>
            <span className={cn(CARD_VALUE, alert && "text-bad")}>{value}</span>
            <span className={CARD_LABEL}>{label}</span>
          </div>
        ))}
      </div>
      <PillTabs
        label="Show"
        size="sm"
        items={VIEWS.map((v) =>
          v.value === "attention" ? { ...v, count: attention.length || undefined } : v,
        )}
        value={view}
        onValueChange={setView}
        className="flex-wrap overflow-visible"
      />
      <div className={TABLE_CARD}>
        <div
          aria-hidden="true"
          className={cn(
            GRID,
            "hidden h-11 border-b border-line bg-surface px-5 text-12 font-semibold tracking-p050 text-fg-3 uppercase tablet:grid",
          )}
        >
          <span>Valet</span>
          <span>Reliability</span>
          <span>Shifts · on time</span>
          <span>Late · no-shows · late drops</span>
          <span className="text-right">Earned</span>
        </div>
        {shown.map((row) => (
          <Link
            key={row.staffId}
            href={`/admin/performance/valet?id=${row.staffId}`}
            className={cn(
              GRID,
              "min-h-17 border-b border-line px-4 py-2 text-fg no-underline transition-colors duration-160 last:border-b-0 hover:bg-surface/60 tablet:px-5",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <PersonAvatar name={row.name} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-16 font-semibold">{row.name}</span>
                <span className="truncate text-13 text-fg-2 tablet:hidden">
                  {row.shifts} shifts · {row.late} late · {row.noShows} no-shows
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2 justify-self-end tablet:justify-self-start">
              <span className="font-display text-20 font-bold tabular-nums">
                {row.score ?? "—"}
              </span>
              <StatusBadge status={BAND[row.band]} size="sm" />
            </span>
            <span className="hidden text-15 text-fg-2 tabular-nums tablet:block">
              {row.shifts} · {formatHoursDecimal(row.minutes)} ·{" "}
              {row.onTimePct === null ? "—" : `${row.onTimePct}%`}
            </span>
            <span
              className={cn(
                "hidden text-15 tabular-nums tablet:block",
                row.noShows + row.lateDrops > 0 ? "font-semibold text-bad" : "text-fg-2",
              )}
            >
              {row.late} · {row.noShows} · {row.lateDrops}
            </span>
            <span className="hidden text-right text-15 font-semibold tabular-nums tablet:block">
              {formatMoney(row.earnedCents)}
            </span>
          </Link>
        ))}
        {shown.length === 0 && (
          <p className="m-0 flex items-center justify-center gap-2 py-8 text-15 text-fg-2">
            <Icon name="check_circle" filled size={18} />
            No one here for this period.
          </p>
        )}
      </div>
      <p className="m-0 text-13 text-fg-3">
        Active valets who finished sign-up. Open a valet for their activity log, the numbers behind
        the score and notes.
      </p>
    </div>
  )
}
