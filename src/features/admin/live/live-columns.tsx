"use client"

import { useState, type ReactNode } from "react"

import { PillTabs, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { LiveSlot, SlotState } from "@/lib/data/admin/ops-schemas"
import { sheetSlots, type EventSummary } from "@/lib/live/model"
import { cn } from "@/lib/utils"

import { SlotBar, SlotRow } from "./live-parts"
import type { LiveBoard } from "./use-live-board"

/** White card on the page ground, like the invoice page (Regency mockup). */
export const CARD = "rounded-r24 border border-line bg-elev"
export const COLUMN = "flex min-h-0 flex-1 flex-col overflow-hidden"
export const BODY = "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
const ACTION = "h-10 px-3.5 text-14 whitespace-nowrap"
const EMPTY = "m-0 px-3 py-4 text-15 text-fg-2"

export const countOf = <T,>(items: T[], test: (item: T) => boolean) => items.filter(test).length

/**
 * The board shows one column at a time: the column switch (`nav`) on the left of the panel's
 * top row, that column's own filters on the right.
 */
export function ColumnHead({ nav, tabs }: { nav: ReactNode; tabs: ReactNode }) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
      {nav}
      <div className="ml-auto">{tabs}</div>
    </div>
  )
}

export const TITLE = "m-0 text-18 leading-x125 font-semibold tracking-n010"

type EventFilter = "all" | "live" | "upcoming"
const EVENT_FILTER: Record<EventFilter, (event: EventSummary) => boolean> = {
  all: () => true,
  live: (event) => event.live,
  upcoming: (event) => !event.live,
}

function EventRow({
  event,
  selected,
  onSelect,
}: {
  event: EventSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-current={selected || undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-r16 border-0 px-4 py-3.5 text-left text-fg transition-[transform,background-color] duration-160 active:scale-98",
        selected
          ? "bg-surface shadow-[inset_0_0_0_1px_var(--line)]"
          : "bg-transparent hover:bg-surface/60",
      )}
    >
      <div className="flex w-full items-start gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="text-16 leading-x125 font-semibold">{event.venue}</span>
          <span className="text-13 text-fg-2">
            {event.time} · {event.rel}
          </span>
        </div>
        <StatusBadge status={event.health.status} size="sm" />
      </div>
      <SlotBar bar={event.bar} label={event.legend} className="h-2" />
      <div className="flex w-full justify-between text-13 font-medium text-fg-2">
        <span>{event.legend}</span>
        <span className="font-semibold text-fg">{event.filledOf}</span>
      </div>
    </button>
  )
}

export function EventsColumn({
  board,
  selectedId,
  onSelect,
  nav,
}: {
  board: LiveBoard
  selectedId: string | undefined
  onSelect: (id: string) => void
  nav: ReactNode
}) {
  const [filter, setFilter] = useState<EventFilter>("all")
  const all = board.summaries
  const events = all.filter(EVENT_FILTER[filter])
  return (
    <section aria-label="Events" className={cn(COLUMN, CARD)}>
      <ColumnHead
        nav={nav}
        tabs={
          <PillTabs
            label="Show events"
            size="sm"
            value={filter}
            onValueChange={setFilter}
            items={[
              { value: "all", label: "All" },
              { value: "live", label: "Live", count: countOf(all, EVENT_FILTER.live) },
              { value: "upcoming", label: "Upcoming", count: countOf(all, EVENT_FILTER.upcoming) },
            ]}
          />
        }
      />
      <div className={cn(BODY, "grid grid-cols-3 content-start gap-2 p-3")}>
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            selected={event.id === selectedId}
            onSelect={() => onSelect(event.id)}
          />
        ))}
        {events.length === 0 && <p className={cn(EMPTY, "col-span-full")}>No events here.</p>}
      </div>
    </section>
  )
}

type SlotFilter = "all" | "onsite" | "expected" | "open"
const SLOT_GROUP: Record<SlotState, Exclude<SlotFilter, "all">> = {
  onsite: "onsite",
  flagged: "onsite",
  override: "onsite",
  waiting: "expected",
  late: "expected",
  due: "expected",
  upcoming: "expected",
  open: "open",
}

export function RosterColumn({
  board,
  event,
  onView,
  nav,
}: {
  board: LiveBoard
  event: EventSummary
  onView: (slot: LiveSlot) => void
  nav: ReactNode
}) {
  const [filter, setFilter] = useState<SlotFilter>("all")
  const slots = sheetSlots(event)
  const inGroup = (group: SlotFilter) => (entry: (typeof slots)[number]) =>
    group === "all" || SLOT_GROUP[entry.slot.state] === group
  const shown = slots.filter(inGroup(filter))
  return (
    <section aria-label={`${event.venue} roster`} className={cn(COLUMN, CARD)}>
      <ColumnHead
        nav={nav}
        tabs={
          <PillTabs
            label="Show slots"
            size="sm"
            value={filter}
            onValueChange={setFilter}
            items={[
              { value: "all", label: "All", count: slots.length },
              { value: "onsite", label: "On site", count: countOf(slots, inGroup("onsite")) },
              { value: "expected", label: "Expected", count: countOf(slots, inGroup("expected")) },
              { value: "open", label: "Open", count: countOf(slots, inGroup("open")) },
            ]}
          />
        }
      />
      <div className={cn(BODY, "gap-3 px-5 pt-4 pb-4")}>
        <div className="flex items-start gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className={TITLE}>{event.venue}</h2>
            <span className="text-13 text-fg-2">
              {event.time} · {event.rel}
            </span>
          </div>
          <StatusBadge status={event.health.status} size="sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="xs"
            className={ACTION}
            onClick={() => board.addSlot(event.id)}
          >
            Add slot
          </Button>
          <Button
            variant="secondary"
            size="xs"
            className={ACTION}
            onClick={() => board.broadcastEvent(event.id)}
          >
            Broadcast
          </Button>
          <Button
            variant="secondary"
            size="xs"
            className={ACTION}
            onClick={() => board.messageCrew(event.id)}
          >
            Message crew
          </Button>
        </div>
        <ul className="m-0 flex list-none flex-col p-0">
          {shown.map(({ slot }) => (
            <SlotRow
              key={slot.id}
              compact
              slot={slot}
              onAssign={() => board.assign(event.id)}
              onView={onView}
            />
          ))}
        </ul>
        {shown.length === 0 && <p className={EMPTY}>No one here.</p>}
      </div>
    </section>
  )
}
