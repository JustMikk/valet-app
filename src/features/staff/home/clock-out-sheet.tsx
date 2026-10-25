"use client"

import { ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { formatHoursMinutes } from "@/lib/time/duration"

type ClockOutSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Seconds worked so far. */
  secs: number
  /** Scheduled end, e.g. "11:00 PM". */
  endLabel: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
}

/** "Clock out now? You've worked 2h 14m" sheet (bottom sheet on phone, dialog from 700 px). */
export function ClockOutSheet({
  open,
  onOpenChange,
  secs,
  endLabel,
  busy = false,
  error = null,
  onConfirm,
}: ClockOutSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Clock out now?"
      titleHidden
      dismissible={false}
    >
      <span className="text-15 font-medium text-fg-2">Clock out now? You&apos;ve worked</span>
      <span className="font-display text-52 leading-x100 font-bold tracking-n040 tabular-nums">
        {formatHoursMinutes(secs)}
      </span>
      <span className="text-15 leading-x145 text-fg-2">
        Scheduled end is {endLabel}. Your location is checked once more as you leave. Leaving early
        or outside the venue is fine; it&apos;s noted for your manager.
      </span>
      {error && (
        <span role="alert" className="text-14 leading-x140 font-semibold text-warn">
          {error}
        </span>
      )}
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
          Keep working
        </Button>
        <Button variant="strong" className="flex-1" disabled={busy} onClick={onConfirm}>
          Clock out
        </Button>
      </div>
    </ResponsiveSheet>
  )
}
