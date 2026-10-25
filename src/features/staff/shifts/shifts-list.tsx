"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  ActionButton,
  Countdown,
  EmptyState,
  PageContainer,
  PageTitle,
  StatusBadge,
  UnderlineTabs,
} from "@/components/shared"
import type { ShiftCard, ShiftTab } from "@/lib/data"

import { QueryState } from "../data/query-state"
import { useShifts } from "../data/queries"

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
]

/** "My shifts": upcoming and past tabs of shift cards. */
export function ShiftsList() {
  const router = useRouter()
  const [tab, setTab] = useState<ShiftTab>("upcoming")
  const shifts = useShifts(tab)

  const open = (shift: ShiftCard) =>
    router.push(shift.isTonight ? "/staff" : `/staff/shifts/detail?id=${shift.id}`)

  return (
    <PageContainer className="max-w-280">
      <div className="flex flex-col gap-5">
        <PageTitle>My shifts</PageTitle>
        <UnderlineTabs
          label="Shifts"
          items={TABS}
          value={tab}
          onValueChange={(value) => setTab(value === "past" ? "past" : "upcoming")}
          listClassName="gap-6.5"
        />
        <QueryState query={shifts}>
          {(items) =>
            items.length === 0 ? (
              <EmptyState
                icon={tab === "past" ? "schedule" : "calendar_month"}
                title={tab === "past" ? "No past shifts yet" : "No upcoming shifts"}
                action={
                  tab === "upcoming" ? (
                    <ActionButton
                      variant="accent"
                      size="cta"
                      className="w-full"
                      onClick={() => router.push("/staff/open")}
                    >
                      See open shifts
                    </ActionButton>
                  ) : undefined
                }
              >
                {tab === "past"
                  ? "Shifts you work show up here with your hours."
                  : "Claim an open shift or wait for dispatch to assign you."}
              </EmptyState>
            ) : (
              <div key={tab} className="grid gap-3 desktop:grid-cols-2">
                {items.map((shift, i) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => open(shift)}
                    // Staggered entry: each card rises 60 ms after the previous one.
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="flex animate-rise flex-col gap-2.5 rounded-card border-0 glass-card p-4.5 text-left text-fg transition-transform duration-160 active:scale-985"
                  >
                    <div className="flex w-full items-center gap-2">
                      <StatusBadge status={shift.status} size="sm" />
                      <span className="ml-auto text-14 font-medium text-fg-2">{shift.date}</span>
                    </div>
                    <span className="font-display text-22 leading-x120 font-semibold tracking-n020">
                      {shift.venue}
                    </span>
                    <div className="flex w-full justify-between text-15 text-fg-2">
                      <span>{shift.time}</span>
                      <span className="font-semibold text-fg">{shift.right}</span>
                    </div>
                    <Countdown startsAt={shift.startsAt} endsAt={shift.endsAt} />
                  </button>
                ))}
              </div>
            )
          }
        </QueryState>
      </div>
    </PageContainer>
  )
}
