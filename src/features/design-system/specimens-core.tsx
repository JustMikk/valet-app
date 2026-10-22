"use client"

import { useState, type ReactNode } from "react"

import {
  ActionButton,
  ChipGroup,
  CoverageBar,
  GlassPill,
  HeroStat,
  Icon,
  IconButton,
  ListRow,
  ListRowAction,
  ListRowValue,
  StatusBadge,
  UnderlineTabs,
} from "@/components/shared"
import { STATUS } from "@/lib/status/presets"

import { Mono } from "./primitives"

/** One labelled specimen block of section 05. */
export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <span className="font-mono text-12 leading-x100 font-medium text-fg-3">{label}</span>
      {children}
    </div>
  )
}

const NOTE = "text-13 leading-x140 text-fg-2"

const DAYS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "sat", label: "Sat 24" },
  { value: "sun", label: "Sun 25" },
] as const

const BADGES = [
  STATUS.onSite,
  STATUS.flaggedQueued,
  STATUS.expected,
  STATUS.dueNow,
  STATUS.late(12),
  STATUS.waitingApproval,
  STATUS.openSlot,
  STATUS.clockedOut,
  STATUS.missingClockOut,
  STATUS.noShow,
  STATUS.dropped,
  STATUS.pushOff,
]

/** Specimens from top bar to coverage bar, in the sheet's order. */
export function CoreSpecimens() {
  const [day, setDay] = useState<(typeof DAYS)[number]["value"]>("today")

  return (
    <>
      <Specimen label="top-bar · menu pill + icon button">
        <div className="flex items-center justify-between">
          <GlassPill>
            <Icon name="menu" filled weight={600} size={26} />
            Live Board
          </GlassPill>
          <IconButton icon="notifications" label="Notifications" badge="New" />
        </div>
      </Specimen>

      <Specimen label="hero-stat · display + delta line">
        <HeroStat
          value="2h 14m"
          delta={{
            tone: "ok",
            icon: "north_east",
            label: "On the clock",
            context: "since 5:51 PM",
          }}
        />
      </Specimen>

      <Specimen label="tabs · underline">
        <UnderlineTabs
          label="Board views"
          defaultValue="events"
          listClassName="-mx-7 px-7"
          items={[
            { value: "events", label: "Events" },
            { value: "timeline", label: "Timeline" },
            { value: "people", label: "People" },
          ]}
        />
      </Specimen>

      <Specimen label="chip-group · filter / range">
        <ChipGroup
          label="Day"
          items={[...DAYS]}
          value={day}
          onValueChange={setDay}
          trailing={
            <button
              type="button"
              aria-label="Filters"
              className="grid size-10 place-items-center border-0 bg-transparent text-fg-2"
            >
              <Icon name="tune" filled />
            </button>
          }
        />
      </Specimen>

      <Specimen label="button · primary (accent) / strong / secondary / ghost / destructive">
        <div className="grid grid-cols-2 gap-2.5">
          <ActionButton variant="accent" size="lg" icon="login" className="col-span-2 text-18">
            Clock in
          </ActionButton>
          <ActionButton variant="strong">Approve</ActionButton>
          <ActionButton variant="secondary">Message</ActionButton>
          <ActionButton variant="ghost" size="sm" iconEnd="chevron_right">
            View roster
          </ActionButton>
          <ActionButton variant="destructive-soft" size="sm">
            Mark no-show
          </ActionButton>
        </div>
        <span className={NOTE}>
          L 56 · M 48 · S 40. One accent button per view. Disabled = <Mono>--surface</Mono> fill,{" "}
          <Mono>--fg-3</Mono> label, plus a reason line.
        </span>
      </Specimen>

      <Specimen label="list-row · label / value / chevron">
        <div className="flex flex-col border-t border-line">
          <ListRow trailing={<ListRowValue>5:45 PM</ListRowValue>}>Clock-in opens</ListRow>
          <ListRow trailing={<ListRowAction chevron>Directions</ListRowAction>}>
            400 Market St, San Francisco
          </ListRow>
        </div>
      </Specimen>

      <Specimen label="status-badge · slot & health states (icon + words, never color alone)">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((status) => (
            <StatusBadge key={status.label} status={status} />
          ))}
        </div>
      </Specimen>

      <Specimen label="coverage-bar · on site + expected + open = headcount">
        <CoverageBar counts={{ onSite: 4, late: 1, expected: 0, open: 1 }} legend />
        <span className={NOTE}>
          Expected-on-time segments use <Mono>--fg-3</Mono>; they turn <Mono>--warn</Mono> once
          late. Open is always hatched + outlined so it reads without color.
        </span>
      </Specimen>
    </>
  )
}
