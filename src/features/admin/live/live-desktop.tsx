"use client"

import { useState } from "react"
import Link from "next/link"

import { ChipGroup, Icon, PillTabs, ToastPill } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { LiveSlot } from "@/lib/data/admin/ops-schemas"
import type { Pulse } from "@/lib/live/model"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { AttentionColumn } from "./live-attention-column"
import { CARD, EventsColumn, RosterColumn } from "./live-columns"
import { LiveDot, Trend } from "./live-parts"
import { StaffLocationModal } from "./staff-location-modal"
import type { LiveBoard } from "./use-live-board"

type View = "events" | "roster" | "attention"

type Day = "today" | "tomorrow" | "pick"
const DAYS: { value: Day; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "pick", label: "Pick date" },
]

/** Each count opens with a line icon, like the reference dashboard's stat cards. */
const KPI_ICON: Record<keyof Pulse, IconName> = {
  need: "error",
  live: "sensors",
  onShift: "group",
  expected: "schedule",
  open: "person_add",
}

function Kpi({
  value,
  label,
  kpi,
  tone,
  first,
}: {
  value: number
  label: string
  kpi: keyof Pulse
  tone?: "bad"
  first?: boolean
}) {
  return (
    <div className={cn(CARD, "flex flex-col gap-3 rounded-r20 p-4.5", first && "pl-5")}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-r12",
            tone === "bad" ? "bg-bad-soft text-bad" : "bg-surface text-fg-2",
          )}
        >
          <Icon name={KPI_ICON[kpi]} size={22} />
        </span>
        <Trend kpi={kpi} />
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "font-display text-34 leading-x100 font-bold tracking-n040 tabular-nums",
            tone === "bad" && "text-bad",
          )}
        >
          {value}
        </span>
        <span className="text-14 font-medium text-fg-2">{label}</span>
      </div>
    </div>
  )
}

/** Live Board for 1100 px and wider: KPI card, then event list, roster and attention as three cards. */
export function LiveDesktop({ board }: { board: LiveBoard }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [day, setDay] = useState<Day>("today")
  const [viewSlot, setViewSlot] = useState<LiveSlot | null>(null)
  const { pulse } = board
  const [view, setView] = useState<View>("events")
  const selected = board.summaries.find((e) => e.id === selectedId) ?? board.summaries[0]
  const nav = (
    <PillTabs
      label="Show"
      value={view}
      onValueChange={setView}
      items={[
        { value: "events", label: "Events", count: board.summaries.length },
        ...(selected ? [{ value: "roster" as const, label: selected.venue }] : []),
        { value: "attention", label: "Attention", count: pulse.need },
      ]}
    />
  )

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="mb-5 flex items-center gap-4 border-b border-line bg-elev px-6 py-5">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="m-0 font-display text-34 leading-x100 font-bold tracking-n030">
            Live Board
          </h1>
          <span className="flex items-center gap-2 text-14 font-medium whitespace-nowrap text-fg-2">
            <LiveDot />
            <span>
              · updated{" "}
              {board.updatedAt ? new Date(board.updatedAt).toLocaleTimeString("en-US") : "…"} ·
              venue times {board.zone}
            </span>
          </span>
        </div>
        <ChipGroup label="Day" items={DAYS} value={day} onValueChange={setDay} />
        <label className="flex h-11 w-60 items-center gap-2 rounded-pill bg-surface px-4 text-15 text-fg-2">
          <Icon name="search" size={20} />
          <input
            type="search"
            aria-label="Find a person or venue"
            placeholder="Find a person or venue"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-15 text-fg outline-none placeholder:text-fg-2"
          />
        </label>
        <Button
          variant="accent"
          size="compact"
          className="h-11 gap-1.5 px-5"
          nativeButton={false}
          render={<Link href="/admin/events/new" />}
        >
          <Icon name="add" size={20} />
          New event
        </Button>
      </header>

      <div className="mx-6 grid grid-cols-5 gap-3">
        <Kpi first value={pulse.need} label="Need you" kpi="need" tone="bad" />
        <Kpi value={pulse.live} label="Events live" kpi="live" />
        <Kpi value={pulse.onShift} label="On shift" kpi="onShift" />
        <Kpi value={pulse.expected} label="Expected, not here" kpi="expected" />
        <Kpi value={pulse.open} label="Open slots today" kpi="open" />
      </div>

      <div className="flex min-h-0 flex-1 px-6 pt-4 pb-5">
        {view === "events" && (
          <EventsColumn
            board={board}
            nav={nav}
            selectedId={selected?.id}
            onSelect={(id) => {
              setSelectedId(id)
              setView("roster")
            }}
          />
        )}
        {view === "roster" && selected && (
          <RosterColumn board={board} nav={nav} event={selected} onView={setViewSlot} />
        )}
        {view === "attention" && <AttentionColumn board={board} nav={nav} />}
      </div>

      <ToastPill message={board.toast} placement="bottom" />
      <StaffLocationModal
        slot={viewSlot}
        open={viewSlot !== null}
        onClose={() => setViewSlot(null)}
      />
    </div>
  )
}
