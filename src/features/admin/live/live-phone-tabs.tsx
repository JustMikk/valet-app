"use client"

import { useState } from "react"

import { Icon, PersonAvatar, StatusBadge } from "@/components/shared"
import { cn } from "@/lib/utils"

import { HEALTH_TEXT, SlotBar } from "./live-parts"
import type { LiveBoard } from "./use-live-board"

const ROW_PRESS = "transition-[transform,background-color] duration-160 active:scale-97"
/** "4p", "12a", "12p": the axis labels, on a 24-hour count that may run past midnight. */
const hourLabel = (h: number) => {
  const hour = ((h % 24) + 24) % 24
  return `${hour % 12 === 0 ? 12 : hour % 12}${hour >= 12 ? "p" : "a"}`
}

export function Timeline({ board, onOpen }: { board: LiveBoard; onOpen: (id: string) => void }) {
  const axis = board.timeline
  if (!axis) return null
  const pct = (hour: number) => ((hour - axis.from) / axis.span) * 100
  return (
    <div className="flex flex-col gap-6">
      {board.attention.length > 0 && (
        <ul className="m-0 flex list-none flex-col border-t border-line p-0">
          {board.attention.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onOpen(item.eventId)}
                className={cn(
                  "box-content flex min-h-16 w-full items-center gap-3 border-0 border-b border-line bg-transparent py-2 text-left text-fg",
                  ROW_PRESS,
                )}
              >
                <span
                  className={cn(
                    "grid size-10 flex-none place-items-center rounded-pill",
                    item.tone === "bad" && "bg-bad-soft text-bad",
                    item.tone === "warn" && "bg-warn-soft text-warn",
                    item.tone === "info" && "bg-info-soft text-info",
                  )}
                >
                  <Icon name={item.icon} filled size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-16 leading-x130 font-semibold">{item.title}</span>
                  <span className="text-13 leading-x130 text-fg-2">{item.short}</span>
                </span>
                <Icon name="chevron_right" size={24} className="text-fg-2" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2.5">
        <div aria-hidden="true" className="relative h-4.5 font-mono text-11 font-medium text-fg-3">
          {axis.ticks.map((h) => (
            <span key={h} className="absolute -translate-x-0.5" style={{ left: `${pct(h)}%` }}>
              {hourLabel(h)}
            </span>
          ))}
        </div>
        <div className="relative flex flex-col gap-3.5">
          <div
            aria-hidden="true"
            className="absolute -top-1.5 -bottom-1.5 z-2 w-0.5 bg-fg"
            style={{ left: `${pct(axis.now)}%` }}
          >
            <span className="absolute -top-1.5 -left-1.25 size-3 rounded-pill bg-fg" />
          </div>
          {board.summaries.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onOpen(event.id)}
              className={cn(
                "flex flex-col gap-1.5 border-0 bg-transparent p-0 text-left text-fg",
                ROW_PRESS,
              )}
            >
              <div className="flex w-full items-center gap-1.5">
                <Icon
                  name={event.health.status.icon}
                  filled
                  size={18}
                  className={HEALTH_TEXT[event.health.status.tone]}
                />
                <span className="text-15 font-semibold">{event.venue}</span>
                <span className="ml-auto text-13 font-medium text-fg-2">{event.filledOf}</span>
              </div>
              <div className="relative h-6.5 w-full rounded-r8 bg-surface">
                <div
                  className="absolute inset-y-1"
                  style={{
                    left: `${pct(event.start)}%`,
                    width: `${((Math.min(event.end, axis.from + axis.span) - event.start) / axis.span) * 100}%`,
                  }}
                >
                  <SlotBar
                    bar={event.bar}
                    label={event.legend}
                    grow={false}
                    className="h-full gap-0.5"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
        <span className="text-13 leading-x140 text-fg-3">
          {hourLabel(axis.from).toUpperCase()} – {hourLabel(axis.from + axis.span).toUpperCase()} ·
          venue time ({board.zone}). Bars show coverage composition; tap for roster.
        </span>
      </div>
    </div>
  )
}

export function People({ board }: { board: LiveBoard }) {
  const [query, setQuery] = useState("")
  const people = board.people(query)
  return (
    <div className="flex flex-col gap-3">
      <label className="flex h-13 items-center gap-2.5 rounded-pill bg-surface px-4.5">
        <Icon name="search" size={22} className="text-fg-2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a person"
          aria-label="Find a person"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-17 text-fg outline-none placeholder:text-fg-3"
        />
      </label>
      <ul className="m-0 flex list-none flex-col border-t border-line p-0">
        {people.map((p, i) => (
          <li
            key={`${p.name}-${i}`}
            className="box-content flex min-h-17 items-center gap-3 border-b border-line"
          >
            <PersonAvatar name={p.name} className="size-10.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-16 font-semibold">{p.name}</span>
              <span className="text-13 text-fg-2">{p.where}</span>
            </div>
            <StatusBadge status={p.status} size="sm" />
          </li>
        ))}
        {people.length === 0 && (
          <li className="py-8 text-center text-15 text-fg-2">No one matches that.</li>
        )}
      </ul>
    </div>
  )
}
