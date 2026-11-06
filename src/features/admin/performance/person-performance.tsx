"use client"

import type { PersonInsights } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { SectionTitle } from "../common/admin-page"
import { ScoreCard } from "./insight-parts"

type Fact = [label: string, value: string, alert?: boolean]

function FactList({ title, facts }: { title: string; facts: Fact[] }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>{title}</SectionTitle>
      <dl className="m-0 flex flex-col rounded-r20 border border-line bg-elev px-4.5 py-1">
        {facts.map(([label, value, alert]) => (
          <div
            key={label}
            className="flex min-h-11 items-center justify-between gap-4 border-b border-line last:border-b-0"
          >
            <dt className="text-14 text-fg-2">{label}</dt>
            <dd className={cn("m-0 text-15 font-semibold tabular-nums", alert && "text-bad")}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const TABLE_HEAD =
  "border-b border-line bg-surface px-3 py-2 text-left text-12 font-semibold tracking-p050 text-fg-3 uppercase"
const TABLE_CELL = "border-b border-line px-3 py-2.5 text-14 tabular-nums"

/** The numbers behind the score, month by month and venue by venue. */
export function PersonPerformance({ insights }: { insights: PersonInsights }) {
  const { stats } = insights
  const percent = (part: number, whole: number) =>
    whole ? `${Math.round((100 * part) / whole)}%` : "—"
  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-5 desktop:grid-cols-2">
        <ScoreCard insights={insights} />
        <FactList
          title="Attendance"
          facts={[
            ["Shifts worked", String(stats.shifts)],
            ["Hours worked", formatHoursDecimal(stats.minutes)],
            ["On time", `${stats.onTime} · ${percent(stats.onTime, stats.shifts)}`],
            ["Late arrivals", String(stats.late), stats.late > 0],
            ["Average lateness", stats.avgLateMin === null ? "—" : `${stats.avgLateMin} min`],
            ["No-shows", String(stats.noShows), stats.noShows > 0],
          ]}
        />
        <FactList
          title="Commitments"
          facts={[
            ["Shifts they claimed", String(stats.claimed)],
            ["Shifts an admin assigned", String(stats.assigned)],
            ["Drops with notice", String(stats.drops - stats.lateDrops)],
            ["Drops within 24 hours", String(stats.lateDrops), stats.lateDrops > 0],
            ["Removed by an admin", String(stats.removed)],
          ]}
        />
        <FactList
          title="Clock-ins and pay"
          facts={[
            ["Clock-ins outside the fence", String(stats.outsideFence), stats.outsideFence > 0],
            ["Flagged clock-outs", String(stats.flagged), stats.flagged > 0],
            ["Hours corrected by an admin", String(stats.adjustments)],
            ["Shifts with tips", String(stats.tipsShifts)],
            ["Earned", formatMoney(stats.earnedCents)],
            ["Paid", formatMoney(stats.paidCents)],
            ["Pending", formatMoney(stats.pendingCents)],
          ]}
        />
      </div>

      <section className="flex flex-col gap-2">
        <SectionTitle>Month by month</SectionTitle>
        <div className="overflow-x-auto rounded-r20 border border-line bg-elev">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr>
                {["Month", "Shifts", "Hours", "Late", "No-shows"].map((heading) => (
                  <th key={heading} scope="col" className={TABLE_HEAD}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insights.months.map((month) => (
                <tr key={month.label}>
                  <th scope="row" className={cn(TABLE_CELL, "text-left font-semibold")}>
                    {month.label}
                  </th>
                  <td className={TABLE_CELL}>{month.shifts}</td>
                  <td className={TABLE_CELL}>{formatHoursDecimal(month.minutes)}</td>
                  <td className={cn(TABLE_CELL, month.late > 0 && "font-semibold text-bad")}>
                    {month.late}
                  </td>
                  <td className={cn(TABLE_CELL, month.noShows > 0 && "font-semibold text-bad")}>
                    {month.noShows}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FactList
        title="Venues worked most"
        facts={
          insights.venues.length
            ? insights.venues.map((venue) => [
                venue.venue,
                `${venue.shifts} shifts · ${formatHoursDecimal(venue.minutes)}`,
              ])
            : [["No shifts in this period", "—"]]
        }
      />
    </div>
  )
}
