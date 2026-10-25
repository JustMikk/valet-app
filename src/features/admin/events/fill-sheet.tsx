"use client"

import { useState } from "react"

import { ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { ErrorNotice } from "../data/query-state"
import { useAssign, useAvailable } from "../data/queries"
import { StaffPicker } from "./staff-picker"

type FillSheetProps = {
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  openSpots: number
}

/** Pick available people for the unfilled spots; the CTA states how many will be notified. */
export function FillSheet({ eventId, open, onOpenChange, openSpots }: FillSheetProps) {
  const [picks, setPicks] = useState<string[]>([])
  const available = useAvailable(eventId, open)
  const assign = useAssign()

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Fill ${openSpots} open ${openSpots === 1 ? "spot" : "spots"}`}
      description="Available and not already working tonight."
    >
      <StaffPicker
        people={available.data ?? []}
        selected={picks}
        onChange={setPicks}
        max={openSpots}
      />
      {available.error && <ErrorNotice message={available.error.message} />}
      {assign.error && <ErrorNotice message={assign.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={picks.length === 0 || assign.isPending}
        onClick={() =>
          assign.mutate(
            { eventId, staffIds: picks },
            {
              onSuccess: () => {
                setPicks([])
                onOpenChange(false)
              },
            },
          )
        }
      >
        {picks.length ? `Assign ${picks.length} · notify them` : "Pick someone"}
      </Button>
    </ResponsiveSheet>
  )
}
