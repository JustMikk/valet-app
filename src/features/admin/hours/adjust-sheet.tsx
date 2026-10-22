"use client"

import { ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { ADJUSTED, type HoursEntry } from "@/mocks/admin"

type AdjustSheetProps = {
  /** The entry being adjusted; null closes the sheet. */
  entry: HoursEntry | null
  onClose: () => void
  onSave: (id: string) => void
}

const TIME_FIELD =
  "flex h-14 items-center rounded-field bg-surface px-4 font-mono text-18 font-semibold"

/** Correct an entry's times with a reason shared with the person, then approve it. */
export function AdjustSheet({ entry, onClose, onSave }: AdjustSheetProps) {
  const first = entry?.name.split(" ")[0] ?? ""
  // Only the auto-closed entry has a proposed correction in the design.
  const outTime = entry?.adjustable ? ADJUSTED.outTime : entry?.outTime
  const total = entry?.adjustable ? ADJUSTED.total : entry?.total

  return (
    <ResponsiveSheet
      open={entry !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Adjust ${entry?.name ?? ""}’s hours`}
      description={entry ? `${entry.venue}. ${entry.flag}` : undefined}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-14 font-medium">In</span>
          <div className={TIME_FIELD}>{entry?.inTime}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-14 font-medium">Out</span>
          <div className={`${TIME_FIELD} shadow-[inset_0_0_0_2px_var(--fg)]`}>{outTime}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-14 font-medium">Reason (shared with {first})</span>
        <div className="flex min-h-14 items-center rounded-field bg-surface px-4 text-16">
          {entry?.adjustable ? "Confirmed with Marco, left after last car" : "Add a reason"}
        </div>
      </div>
      <Button variant="strong" className="text-17" onClick={() => entry && onSave(entry.id)}>
        Save &amp; approve · {total}
      </Button>
    </ResponsiveSheet>
  )
}
