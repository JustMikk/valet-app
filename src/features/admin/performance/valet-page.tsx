"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { InsightRange, Person, PersonInsights } from "@/lib/data"

import { AdminPage, SectionTitle } from "../common/admin-page"
import { usePersonInsights } from "../data/person-queries"
import { QueryState } from "../data/query-state"
import { usePerson } from "../data/queries"
import { KeyStats, RangePicker, ScoreCard } from "./insight-parts"
import { PersonActivity } from "./person-activity"
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
 * One valet's performance page (`?id=`, ADR-024): reliability at a glance, their activity log,
 * the numbers behind it and the admins' notes, each on its own tab (`&tab=`).
 */
export function ValetPerformance() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get("id") ?? undefined
  const tab = TABS.find((t) => t.value === params.get("tab"))?.value ?? "overview"
  const person = usePerson(id)
  const [days, setDays] = useState<InsightRange>(90)
  return (
    <AdminPage>
      <QueryState query={person} rows={4}>
        {(data) => (
          <div className="flex flex-col gap-5">
            <Header person={data} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PillTabs
                label="Valet"
                items={TABS}
                value={tab}
                onValueChange={(next) =>
                  router.replace(
                    `/admin/performance/valet?id=${data.id}${next === "overview" ? "" : `&tab=${next}`}`,
                  )
                }
                className="flex-wrap overflow-visible"
              />
              {tab !== "notes" && <RangePicker value={days} onChange={setDays} />}
            </div>
            <Insights staffId={data.id} days={days}>
              {(insights) =>
                tab === "overview" ? (
                  <Summary insights={insights} />
                ) : tab === "activity" ? (
                  <PersonActivity insights={insights} />
                ) : tab === "performance" ? (
                  <PersonPerformance insights={insights} />
                ) : (
                  <PersonNotes staffId={data.id} notes={insights.notes} />
                )
              }
            </Insights>
          </div>
        )}
      </QueryState>
    </AdminPage>
  )
}

function Header({ person }: { person: Person }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/admin/performance"
        className="flex items-center gap-1 self-start text-14 font-semibold text-fg-2 no-underline"
      >
        <Icon name="arrow_back" size={18} />
        All valets
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 flex-none place-items-center rounded-pill bg-surface-2 font-display text-24 font-bold"
        >
          {person.initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="m-0 font-display text-30 leading-x105 font-bold tracking-n030">
            {person.name}
          </h1>
          <span className="text-15 text-fg-2">{person.role}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            nativeButton={false}
            render={<Link href={`/admin/staff/person?id=${person.id}`} />}
          >
            <Icon name="person" size={18} />
            Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            nativeButton={false}
            render={<Link href={`/admin/inbox?thread=${person.id}`} />}
          >
            <Icon name="chat_bubble" filled size={18} />
            Message
          </Button>
        </div>
      </div>
    </div>
  )
}

function Insights({
  staffId,
  days,
  children,
}: {
  staffId: string
  days: InsightRange
  children: (insights: PersonInsights) => ReactNode
}) {
  const insights = usePersonInsights(staffId, days)
  return (
    <QueryState query={insights} rows={3}>
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
