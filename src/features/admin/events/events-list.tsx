"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Icon, PillTabs, StatusBadge } from "@/components/shared"
import type { EventCard, EventList, EventTab } from "@/lib/data"
import { ADMIN_STATUS } from "@/lib/status/admin"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, CARD_GRID } from "../common/admin-page"
import { QueryState } from "../data/query-state"
import { useEvents } from "../data/queries"

const STATE_SPEC = {
  live: ADMIN_STATUS.live,
  full: ADMIN_STATUS.full,
  draft: ADMIN_STATUS.draft,
} as const

function EventTile({ event, index }: { event: EventCard; index: number }) {
  const open = Math.max(0, event.need - event.confirmed)
  const status = event.state === "short" ? ADMIN_STATUS.short(open) : STATE_SPEC[event.state]
  const onSitePct = (event.onSite / event.need) * 100
  const confirmedPct = ((event.confirmed - event.onSite) / event.need) * 100

  return (
    <Link
      href={`/admin/events/detail?id=${event.id}`}
      style={{ animationDelay: `${index * 50}ms` }}
      className="flex animate-rise flex-col gap-3 rounded-card glass-card p-4.5 text-left text-fg no-underline transition-transform duration-160 active:scale-985"
    >
      <div className="flex w-full items-center gap-2">
        <StatusBadge status={status} size="sm" />
        <span className="ml-auto font-mono text-15 font-semibold text-fg-2">{event.time}</span>
      </div>
      <div className="flex w-full flex-col gap-0.5">
        <span className="font-display text-21 leading-x120 font-semibold tracking-n020">
          {event.venue}
        </span>
        <span className="text-15 text-fg-2">{event.kind}</span>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        <div
          role="img"
          aria-label={`${event.onSite} on site, ${event.confirmed - event.onSite} confirmed, ${open} unfilled of ${event.need}`}
          className="flex h-2 gap-0.5 overflow-hidden rounded-r9 bg-surface-2"
        >
          {/* Widths are the share of the headcount. */}
          <span
            className="rounded-r9 bg-fg-3-line transition-[width] duration-600"
            style={{ width: `${onSitePct}%` }}
          />
          <span className="rounded-r9 bg-fg-3-line/45" style={{ width: `${confirmedPct}%` }} />
        </div>
        <div className="flex justify-between text-14 font-medium text-fg-2">
          <span>
            {event.state === "live"
              ? `${event.onSite} on site · ${event.confirmed} of ${event.need} confirmed`
              : `${event.confirmed} of ${event.need} confirmed`}
          </span>
          <span className={cn("font-semibold", open ? "text-warn" : "text-fg-2")}>
            {open ? `${open} unfilled` : "Fully staffed"}
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Date filter over the server's day groups ("TODAY · FRI OCT 23", "SAT OCT 24" for tomorrow,
 * "THIS WEEK", "NEXT WEEK", "LATER"), so it needs no new API field.
 */
type DateRange = "any" | "today" | "tomorrow" | "week" | "next" | "later"
const RANGES: { value: DateRange; label: string }[] = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "next", label: "Next week" },
  { value: "later", label: "Later" },
]
const GROUPS = ["THIS WEEK", "NEXT WEEK", "LATER"]
const isToday = (label: string) => label.startsWith("TODAY")
const isTomorrow = (label: string) => !isToday(label) && !GROUPS.includes(label)
const IN_RANGE: Record<DateRange, (label: string) => boolean> = {
  any: () => true,
  today: isToday,
  tomorrow: isTomorrow,
  week: (label) => isToday(label) || isTomorrow(label) || label === "THIS WEEK",
  next: (label) => label === "NEXT WEEK",
  later: (label) => label === "LATER",
}

function DateFilter({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <label className="relative flex h-10 flex-none items-center gap-2 rounded-r10 bg-surface pr-9 pl-3 text-15 font-medium text-fg">
      <Icon name="calendar_month" size={18} className="text-fg-2" />
      <select
        aria-label="Date"
        value={value}
        onChange={(e) => onChange(e.target.value as DateRange)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {RANGES.find((r) => r.value === value)?.label}
      <Icon name="expand_more" size={20} className="absolute right-2 text-fg-2" />
    </label>
  )
}

function Days({ list }: { list: EventList }) {
  return (
    <div className="flex flex-col gap-7">
      {list.days.map((day) => (
        <section key={day.label} className="flex flex-col gap-2.5">
          <h2 className="m-0 text-13 font-semibold tracking-p050 text-fg-3">{day.label}</h2>
          <div className={CARD_GRID}>
            {day.items.map((event, i) => (
              <EventTile key={event.id} event={event} index={i} />
            ))}
          </div>
        </section>
      ))}
      {list.days.length === 0 && (
        <p className="m-0 py-8 text-center text-15 text-fg-2">Nothing here.</p>
      )}
    </div>
  )
}

/** Events: day-grouped cards with coverage bars, filtered by tab. */
export function EventsList() {
  const router = useRouter()
  const [tab, setTab] = useState<EventTab>("upcoming")
  const [range, setRange] = useState<DateRange>("any")
  const events = useEvents(tab)
  const data = events.data
  const inRange = (list: EventList): EventList => ({
    ...list,
    days: list.days.filter((day) => IN_RANGE[range](day.label)),
  })

  const tabs = [
    { value: "live" as const, label: "Live now", count: data?.live || undefined },
    { value: "upcoming" as const, label: "Upcoming" },
    { value: "short" as const, label: "Short-staffed", count: data?.short || undefined },
    { value: "draft" as const, label: "Drafts", count: data?.drafts || undefined },
    { value: "past" as const, label: "Past" },
  ]

  return (
    <AdminPage>
      <AdminHead
        title="Events"
        sub={
          data ? `${data.live} live · ${data.upcoming} upcoming · ${data.short} short-staffed` : "…"
        }
        cta={{ label: "New event", icon: "add", onClick: () => router.push("/admin/events/new") }}
        tools={
          <>
            <PillTabs label="Show" items={tabs} value={tab} onValueChange={setTab} />
            {tab !== "past" && <DateFilter value={range} onChange={setRange} />}
          </>
        }
      />
      {/* Phone: the filters sit under the heading; from tablet they live in the top bar. */}
      <div className="flex items-center gap-2 tablet:hidden">
        <PillTabs
          label="Show"
          items={tabs}
          value={tab}
          onValueChange={setTab}
          className="min-w-0"
        />
        {tab !== "past" && <DateFilter value={range} onChange={setRange} />}
      </div>
      <QueryState query={events} rows={3}>
        {(list) => <Days list={tab === "past" ? list : inRange(list)} />}
      </QueryState>
    </AdminPage>
  )
}
