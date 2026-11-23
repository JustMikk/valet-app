"use client"

import { useState } from "react"

import { ConfirmSheet, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { EventDetail } from "@/lib/data"

import { ErrorNotice } from "../data/query-state"
import { usePublishEvent } from "../data/queries"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** A draft's Publish action: states who is told before acting (ADR-026). */
export function PublishEvent({ event, className }: { event: EventDetail; className?: string }) {
  const [open, setOpen] = useState(false)
  const publish = usePublishEvent()
  const assigned = event.roster.length
  const spots = event.openSlots.length

  return (
    <>
      <Button variant="accent" className={className} onClick={() => setOpen(true)}>
        <Icon name="campaign" filled size={22} />
        Publish event
      </Button>
      {publish.error && <ErrorNotice message={publish.error.message} />}
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={`Publish ${event.venue}?`}
        consequence={`${plural(assigned, "assigned valet")} ${assigned === 1 ? "is" : "are"} told now, in the app and by text. ${plural(spots, "open spot")} ${spots === 1 ? "is" : "are"} posted to staff.`}
        confirmLabel="Publish event"
        onConfirm={() => publish.mutate(event.id, { onSettled: () => setOpen(false) })}
      />
    </>
  )
}
