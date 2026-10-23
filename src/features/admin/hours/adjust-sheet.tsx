"use client"

import { useState } from "react"

import { ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { HoursEntry } from "@/lib/data"

import { ErrorNotice } from "../data/query-state"
import { useHoursActions } from "../data/queries"

type AdjustSheetProps = {
  /** The entry being adjusted; null closes the sheet. */
  entry: HoursEntry | null
  onClose: () => void
}

const TIME_FIELD =
  "flex h-14 items-center rounded-field bg-surface px-4 font-mono text-18 font-semibold"

/** "11:10 PM" → "23:10" for a time input; "" when the display has no time ("—"). */
function toInput(label: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim())
  if (!m) return ""
  const hour = (Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)
  return `${String(hour).padStart(2, "0")}:${m[2]}`
}

/** Correct an entry's out time with a reason shared with the person, then approve it. */
export function AdjustSheet({ entry, onClose }: AdjustSheetProps) {
  return (
    <ResponsiveSheet
      open={entry !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Adjust ${entry?.name ?? ""}’s hours`}
      description={entry ? `${entry.venue}. ${entry.flag}` : undefined}
    >
      {/* Keyed so each entry starts from its own times and an empty reason. */}
      {entry && <AdjustForm key={entry.id} entry={entry} onClose={onClose} />}
    </ResponsiveSheet>
  )
}

function AdjustForm({ entry, onClose }: { entry: HoursEntry; onClose: () => void }) {
  const { adjust } = useHoursActions()
  const [outTime, setOutTime] = useState(toInput(entry.outTime))
  const [reason, setReason] = useState("")
  const first = entry.name.split(" ")[0]
  const ready = outTime !== "" && reason.trim().length >= 3

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-14 font-medium">In</span>
          <div className={TIME_FIELD}>{entry.inTime}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adjust-out" className="text-14 font-medium">
            Out
          </label>
          <input
            id="adjust-out"
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            className={`${TIME_FIELD} border-0 text-fg shadow-[inset_0_0_0_2px_var(--fg)] outline-none`}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adjust-reason" className="text-14 font-medium">
          Reason (shared with {first})
        </label>
        <input
          id="adjust-reason"
          value={reason}
          maxLength={280}
          placeholder="Add a reason"
          onChange={(e) => setReason(e.target.value)}
          className="flex min-h-14 items-center rounded-field border-0 bg-surface px-4 text-16 text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      {adjust.error && <ErrorNotice message={adjust.error.message} />}
      <Button
        variant="strong"
        className="text-17"
        disabled={!ready || adjust.isPending}
        onClick={() =>
          adjust.mutate({ id: entry.id, outTime, reason: reason.trim() }, { onSuccess: onClose })
        }
      >
        Save &amp; approve
      </Button>
    </>
  )
}
