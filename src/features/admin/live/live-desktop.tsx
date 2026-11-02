"use client"

import { useState } from "react"
import Link from "next/link"

import { ChipGroup, Icon, ToastPill } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { LiveSlot } from "@/lib/data/admin/ops-schemas"
import type { Pulse } from "@/lib/live/model"
import { cn } from "@/lib/utils"

import { AttentionColumn } from "./live-attention-column"
import { CARD, EventsColumn, RosterColumn } from "./live-columns"
import { LiveDot, Trend } from "./live-parts"
import { StaffLocationModal } from "./staff-location-modal"
import type { LiveBoard } from "./use-live-board"

type Day = "today" | "tomorrow" | "pick"
const DAYS: { value: Day; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "pick", label: "Pick date" },
]

function Kpi({
  label,
  kpi,
  pulse,
  yesterday,
  tone,
  first,
}: {
  label: string
  kpi: keyof Pulse
  pulse: Pulse
  yesterday: Pulse | null
  tone?: "bad"
  first?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 border-r border-line last:border-r-0",
        first ? "px-8 py-4.5" : "px-6 py-4.5",
      )}
    >
      <span
        className={cn(
          "font-display text-40 leading-x100 font-bold tracking-n040 tabular-nums",
          tone === "bad" && "text-bad",
        )}
      >
        {pulse[kpi]}
      </span>
      <span className="text-14 font-medium text-fg-2">{label}</span>
      <Trend kpi={kpi} pulse={pulse} yesterday={yesterday} className="absolute top-4.5 right-5" />
    </div>
  )
}

/** Live Board for 1100 px and wider: KPI card, then event list, roster and attention as three cards. */
export function LiveDesktop({ board }: { board: LiveBoard }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [day, setDay] = useState<Day>("today")
  const [viewSlot, setViewSlot] = useState<LiveSlot | null>(null)
  const { pulse } = board
  const trend = { pulse, yesterday: board.yesterday }
  const selected = board.summaries.find((e) => e.id === selectedId) ?? board.summaries[0]

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="mb-5 flex items-center gap-4 border-b border-line bg-elev px-8 py-5">
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

      <div className={cn(CARD, "mx-8 grid grid-cols-5 overflow-hidden")}>
        <Kpi first label="Need you" kpi="need" {...trend} tone="bad" />
        <Kpi label="Events live" kpi="live" {...trend} />
        <Kpi label="On shift" kpi="onShift" {...trend} />
        <Kpi label="Expected, not here" kpi="expected" {...trend} />
        <Kpi label="Open slots today" kpi="open" {...trend} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_22.5rem] gap-5 px-8 pt-5 pb-6">
        <EventsColumn board={board} selectedId={selected?.id} onSelect={setSelectedId} />
        {selected && <RosterColumn board={board} event={selected} onView={setViewSlot} />}
        <AttentionColumn board={board} />
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
