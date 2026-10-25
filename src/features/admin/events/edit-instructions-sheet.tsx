"use client"

import { useState } from "react"

import { ResponsiveSheet, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { ErrorNotice } from "../data/query-state"
import { useUpdateEvent } from "../data/queries"

type EditInstructionsSheetProps = {
  eventId: string
  instructions: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Change what the crew is told; everyone assigned is notified when the text changes. */
export function EditInstructionsSheet({
  eventId,
  instructions,
  open,
  onOpenChange,
}: EditInstructionsSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Instructions for crew"
      description="Dress code, who to ask for, where to park. The crew is notified when this changes."
    >
      {/* Mounted only while open, so each opening starts from the saved text. */}
      {open && (
        <InstructionsForm
          eventId={eventId}
          initial={instructions}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveSheet>
  )
}

function InstructionsForm({
  eventId,
  initial,
  onDone,
}: {
  eventId: string
  initial: string
  onDone: () => void
}) {
  const update = useUpdateEvent()
  const [text, setText] = useState(initial)
  const changed = text.trim() !== initial

  return (
    <>
      <TextField
        label="Instructions"
        multiline
        rows={5}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Dress code, who to report to, where staff park"
      />
      {update.error && <ErrorNotice message={update.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={!changed || update.isPending}
        onClick={() =>
          update.mutate(
            { id: eventId, patch: { instructions: text.trim() } },
            { onSuccess: onDone },
          )
        }
      >
        {changed ? "Save and notify crew" : "No changes"}
      </Button>
    </>
  )
}
