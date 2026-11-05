"use client"

import { useState } from "react"

import { TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { formatRate } from "@/lib/money/format"

/** "21" or "21.50" → 2150; null when it isn't a sensible hourly amount. */
export function parseDollars(text: string): number | null {
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(text.trim())) return null
  const cents = Math.round(Number(text) * 100)
  return cents > 0 && cents <= 100_000 ? cents : null
}

type RateEditorProps = {
  rateCents: number
  saving: boolean
  onSave: (rateCents: number) => void
}

/** The event's valet rate, with an inline field to change it. */
export function PayRateEditor({ rateCents, saving, onSave }: RateEditorProps) {
  const [draft, setDraft] = useState<string | null>(null)

  if (draft === null) {
    return (
      <span className="flex items-center gap-2">
        <span className="font-mono text-17 font-semibold">{formatRate(rateCents)}</span>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setDraft((rateCents / 100).toFixed(2))}
        >
          Edit
        </Button>
      </span>
    )
  }

  const cents = parseDollars(draft)
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (cents === null) return
        onSave(cents)
        setDraft(null)
      }}
    >
      <TextField
        label="Valet pay per hour ($)"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        error={cents === null ? "Enter an hourly amount, like 21.00" : undefined}
        className="w-44"
      />
      <Button type="submit" variant="strong" size="xs" disabled={cents === null || saving}>
        Save
      </Button>
      <Button type="button" variant="secondary" size="xs" onClick={() => setDraft(null)}>
        Cancel
      </Button>
    </form>
  )
}
