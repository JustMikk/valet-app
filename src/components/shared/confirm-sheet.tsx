"use client"

import { Button } from "@/components/ui/button"

import { ResponsiveSheet } from "./responsive-sheet"

type ConfirmSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The question, e.g. "Mark Marcus Reed as no-show?" */
  title: string
  /** What happens, in words (Design System "sheet · confirm consequence in words"). */
  consequence: string
  confirmLabel: string
  cancelLabel?: string
  /** Destructive actions use the bad fill; others the strong fill. */
  tone?: "destructive" | "strong"
  onConfirm: () => void
}

/** Two-button confirmation that states the consequence before acting. */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  consequence,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "strong",
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={consequence}
      dismissible={false}
    >
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button variant={tone} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </ResponsiveSheet>
  )
}
