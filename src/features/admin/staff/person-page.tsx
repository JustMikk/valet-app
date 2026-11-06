"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { PillTabs } from "@/components/shared"
import type { InsightRange, PersonInsights } from "@/lib/data"

import { AdminPage, SectionTitle } from "../common/admin-page"
import { usePersonInsights } from "../data/person-queries"
import { QueryState } from "../data/query-state"
import { usePerson } from "../data/queries"
import { KeyStats, RangePicker, ScoreCard } from "./insight-parts"
import { PersonActivity } from "./person-activity"
import { PersonOverview } from "./person-detail"
import { PersonNotes } from "./person-notes"
import { PersonPerformance } from "./person-performance"

type Tab = "overview" | "activity" | "performance" | "notes"
const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "performance", label: "Performance" },
  { value: "notes", label: "Notes" },
]

/**
 * Everything about one valet (`?id=`, ADR-024): profile and reliability at a glance, their activity
 * log, performance numbers and the admins' notes, each on its own tab (`&tab=`).
 */
export function PersonDetail() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get("id") ?? undefined
  const tab = TABS.find((t) => t.value === params.get("tab"))?.value ?? "overview"
  const person = usePerson(id)
  return (
    <AdminPage>
      <QueryState query={person} rows={4}>
        {(data) => (
          <div className="flex flex-col gap-5">
            <PillTabs
              label="Valet"
              items={TABS}
              value={tab}
              onValueChange={(next) =>
                router.replace(
                  `/admin/staff/person?id=${data.id}${next === "overview" ? "" : `&tab=${next}`}`,
                )
              }
              className="flex-wrap self-start overflow-visible"
            />
            {tab === "overview" ? (
              <>
                <Insights staffId={data.id} days={90}>
                  {(insights) => <Summary insights={insights} />}
                </Insights>
                <PersonOverview person={data} />
              </>
            ) : (
              <InsightsTab staffId={data.id} tab={tab} />
            )}
          </div>
        )}
      </QueryState>
    </AdminPage>
  )
}

function Insights({
  staffId,
  days,
  children,
}: {
  staffId: string
  days: InsightRange
  children: (insights: PersonInsights) => React.ReactNode
}) {
  const insights = usePersonInsights(staffId, days)
  return (
    <QueryState query={insights} rows={2}>
      {children}
    </QueryState>
  )
}

function Summary({ insights }: { insights: PersonInsights }) {
  return (
    <div className="grid items-start gap-5 desktop:grid-cols-2">
      <ScoreCard insights={insights} />
      <div className="flex flex-col gap-4">
        <KeyStats insights={insights} />
        <section className="flex flex-col gap-2">
          <SectionTitle>Coming up</SectionTitle>
          <ul className="m-0 flex list-none flex-col rounded-r20 border border-line bg-elev p-0">
            {insights.upcoming.map((shift) => (
              <li
                key={`${shift.event}-${shift.when}`}
                className="flex flex-col gap-0.5 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <span className="text-15 font-semibold">{shift.event}</span>
                <span className="text-13 text-fg-2">{shift.when}</span>
              </li>
            ))}
            {insights.upcoming.length === 0 && (
              <li className="px-4 py-3 text-14 text-fg-2">No upcoming shifts.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

function InsightsTab({ staffId, tab }: { staffId: string; tab: Exclude<Tab, "overview"> }) {
  const [days, setDays] = useState<InsightRange>(90)
  return (
    <div className="flex flex-col gap-4">
      {tab !== "notes" && <RangePicker value={days} onChange={setDays} />}
      <Insights staffId={staffId} days={days}>
        {(insights) =>
          tab === "activity" ? (
            <PersonActivity insights={insights} />
          ) : tab === "performance" ? (
            <PersonPerformance insights={insights} />
          ) : (
            <PersonNotes staffId={staffId} notes={insights.notes} />
          )
        }
      </Insights>
    </div>
  )
}
