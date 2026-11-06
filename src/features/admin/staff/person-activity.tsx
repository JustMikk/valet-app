"use client"

import { useState } from "react"

import { Icon, PillTabs, StatusBadge } from "@/components/shared"
import type { ActivityKind, PersonInsights } from "@/lib/data"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

const ICON: Record<ActivityKind, IconName> = {
  invited: "mail",
  joined: "how_to_reg",
  claimed: "touch_app",
  assigned: "person_add",
  dropped: "event_busy",
  removed: "block",
  clock_in: "login",
  clock_out: "logout",
  adjusted: "edit_calendar",
  paid: "request_quote",
  no_show: "running_with_errors",
}

type Filter = "all" | "shifts" | "clock" | "pay" | "issues"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shifts", label: "Shifts" },
  { value: "clock", label: "Clock-ins" },
  { value: "pay", label: "Pay" },
  { value: "issues", label: "Needs a look" },
]

const IN_FILTER: Record<Exclude<Filter, "all" | "issues">, ActivityKind[]> = {
  shifts: ["claimed", "assigned", "dropped", "removed", "no_show"],
  clock: ["clock_in", "clock_out", "adjusted"],
  pay: ["paid"],
}

const ISSUE = { tone: "warn", icon: "flag", filled: true, label: "Needs a look" } as const

/** Everything this valet did in the period, newest first, filterable. */
export function PersonActivity({ insights }: { insights: PersonInsights }) {
  const [filter, setFilter] = useState<Filter>("all")
  const shown = insights.activity.filter((item) =>
    filter === "all"
      ? true
      : filter === "issues"
        ? item.issue
        : IN_FILTER[filter].includes(item.kind),
  )
  const issues = insights.activity.filter((item) => item.issue).length

  return (
    <div className="flex flex-col gap-4">
      <PillTabs
        label="Show"
        size="sm"
        items={FILTERS.map((f) =>
          f.value === "issues" ? { ...f, count: issues || undefined } : f,
        )}
        value={filter}
        onValueChange={setFilter}
        className="flex-wrap overflow-visible"
      />
      <ol className="m-0 flex list-none flex-col rounded-r24 border border-line bg-elev p-0">
        {shown.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-9 flex-none place-items-center rounded-pill",
                item.issue ? "bg-warn-soft text-warn" : "bg-surface-2 text-fg-2",
              )}
            >
              <Icon name={ICON[item.kind]} filled size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-15 font-semibold [overflow-wrap:anywhere]">{item.title}</span>
              {item.detail && <span className="text-14 text-fg-2">{item.detail}</span>}
              <span className="text-12 text-fg-3">{item.when}</span>
            </span>
            {item.issue && <StatusBadge status={ISSUE} size="sm" className="flex-none" />}
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-4 py-8 text-center text-15 text-fg-2">Nothing in this period.</li>
        )}
      </ol>
    </div>
  )
}
