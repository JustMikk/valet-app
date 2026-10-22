"use client"

import { useState, type ReactNode } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useBreakpoint } from "@/hooks/use-breakpoint"

type ResponsiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean, details?: unknown) => void
  /** Required: every sheet and dialog is named by its title. */
  title: ReactNode
  description?: ReactNode
  /** Names the sheet for assistive tech without showing a heading (e.g. the admin "More" menu). */
  titleHidden?: boolean
  /**
   * Adds a "Close" control that stays visually hidden until keyboard focus reaches it, so
   * screen-reader and keyboard users are never left with only a gesture or the scrim to dismiss.
   * Turn off when the content already ends in an explicit Cancel (ConfirmSheet).
   */
  dismissible?: boolean
  children?: ReactNode
}

export const SHEET_TITLE = "font-display text-28 leading-x110 font-bold tracking-n025 text-fg"
export const SHEET_DESCRIPTION = "text-15 leading-x140 text-fg-2"

const DISMISS =
  "sr-only h-10 rounded-pill border-0 bg-surface px-4 text-15 font-semibold text-fg focus-visible:not-sr-only focus-visible:self-center"

type Variant = "sheet" | "dialog"

/**
 * Bottom sheet on phone, dialog from 700 px. The variant follows the breakpoint only while the
 * sheet is closed: resizing or rotating with it open must not swap the primitive, which would
 * remount the content and drop typed input and focus.
 */
function useSheetVariant(open: boolean): Variant {
  const live: Variant = useBreakpoint() === "phone" ? "sheet" : "dialog"
  const [locked, setLocked] = useState<Variant>(live)
  // React's "adjust state while rendering" pattern: re-sync during render, not in an effect.
  if (!open && locked !== live) setLocked(live)
  return locked
}

/**
 * Bottom sheet on phone (glass, 30 px top corners, grabber, slide up) and centered 440 px dialog
 * from 700 px (radius 28, fade) over the design scrim. Escape and the scrim close it.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  titleHidden = false,
  dismissible = true,
  children,
}: ResponsiveSheetProps) {
  const titleClass = titleHidden ? "sr-only" : SHEET_TITLE
  const variant = useSheetVariant(open)

  if (variant === "sheet") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-sheet border-t-0 bg-sheet [backdrop-filter:var(--blur-lg)] duration-320 ease-(--ease-sheet) [--drawer-bleed-background:var(--sheet)]">
          {/* The vendor drawer renders children inside its own content element, so the
              sheet's padding and 16 px rhythm live on this column. */}
          <div className="flex flex-col gap-4 px-5 pt-3 pb-8">
            <span
              data-grabber
              aria-hidden="true"
              className="h-1.25 w-10 self-center rounded-r9 bg-line"
            />
            <DrawerTitle className={titleClass}>{title}</DrawerTitle>
            {description && (
              <DrawerDescription className={SHEET_DESCRIPTION}>{description}</DrawerDescription>
            )}
            {children}
            {dismissible && <DrawerClose className={DISMISS}>Close</DrawerClose>}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-110 max-w-[calc(100%-2rem)] flex-col gap-4 rounded-dialog bg-sheet px-6 pt-5 pb-6 text-fg shadow-dialog ring-0 [backdrop-filter:var(--blur-lg)] duration-250 sm:max-w-110 data-open:zoom-in-100 data-closed:zoom-out-100">
        <DialogTitle className={titleClass}>{title}</DialogTitle>
        {description && (
          <DialogDescription className={SHEET_DESCRIPTION}>{description}</DialogDescription>
        )}
        {children}
        {dismissible && <DialogClose className={DISMISS}>Close</DialogClose>}
      </DialogContent>
    </Dialog>
  )
}
