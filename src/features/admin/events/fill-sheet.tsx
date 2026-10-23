"use client"

import { useState } from "react"

import { Icon, ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ErrorNotice } from "../data/query-state"
import { useAssign, useAvailable } from "../data/queries"

type FillSheetProps = {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  openSpots: number
}

/** Pick available people for the unfilled spots; the CTA states how many will be notified. */
export function FillSheet({ eventId, open, onOpenChange, openSpots }: FillSheetProps) {
  const [picks, setPicks] = useState<Record<string, boolean>>({})
  const available = useAvailable(eventId, open)
  const assign = useAssign()
  const chosen = Object.keys(picks).filter((id) => picks[id])
  const count = Math.min(chosen.length, openSpots)

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Fill ${openSpots} open ${openSpots === 1 ? "spot" : "spots"}`}
      description="Available and not already working tonight."
    >
      <ul className="m-0 flex list-none flex-col border-t border-line p-0">
        {(available.data ?? []).map((person) => {
          const on = Boolean(picks[person.id])
          return (
            <li key={person.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setPicks((p) => ({ ...p, [person.id]: !on }))}
                className="box-content flex min-h-15.5 w-full items-center gap-3 border-0 border-b border-line bg-transparent p-0 text-left text-fg"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 flex-none place-items-center rounded-pill bg-surface-2 text-14 font-semibold"
                >
                  {person.initials}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-16 font-semibold">{person.name}</span>
                  <span className="text-13 text-fg-2">{person.note}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-7 place-items-center rounded-r8 text-bg transition-[background-color,box-shadow] duration-150",
                    on ? "bg-fg" : "bg-transparent shadow-[inset_0_0_0_2px_var(--line)]",
                  )}
                >
                  {on && <Icon name="check" size={20} />}
                </span>
              </button>
            </li>
          )
        })}
        {available.data?.length === 0 && (
          <li className="py-6 text-15 text-fg-2">No one is free for this shift.</li>
        )}
      </ul>
      {available.error && <ErrorNotice message={available.error.message} />}
      {assign.error && <ErrorNotice message={assign.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={chosen.length === 0 || chosen.length > openSpots || assign.isPending}
        onClick={() =>
          assign.mutate(
            { eventId, staffIds: chosen },
            {
              onSuccess: () => {
                setPicks({})
                onOpenChange(false)
              },
            },
          )
        }
      >
        {chosen.length > openSpots
          ? `Only ${openSpots} open`
          : count
            ? `Assign ${count} · notify them`
            : "Pick someone"}
      </Button>
    </ResponsiveSheet>
  )
}
