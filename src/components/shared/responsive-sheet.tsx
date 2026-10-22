"use client"

import type { ReactNode } from "react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useBreakpoint } from "@/hooks/use-breakpoint"

type ResponsiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean, details?: unknown) => void
  /** Required: every sheet and dialog is named by its title. */
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

export const SHEET_TITLE = "font-display text-28 leading-x110 font-bold tracking-n025 text-fg"
export const SHEET_DESCRIPTION = "text-15 leading-x140 text-fg-2"

/**
 * Bottom sheet on phone (glass, 30 px top corners, grabber, slide up) and centered 440 px dialog
 * from 700 px (radius 28, fade) over the design scrim. Escape and the scrim close it.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveSheetProps) {
  const phone = useBreakpoint() === "phone"

  if (phone) {
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
            <DrawerTitle className={SHEET_TITLE}>{title}</DrawerTitle>
            {description && (
              <DrawerDescription className={SHEET_DESCRIPTION}>{description}</DrawerDescription>
            )}
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-110 max-w-[calc(100%-2rem)] flex-col gap-4 rounded-dialog bg-sheet px-6 pt-5 pb-6 text-fg shadow-dialog ring-0 [backdrop-filter:var(--blur-lg)] duration-250 sm:max-w-110 data-open:zoom-in-100 data-closed:zoom-out-100">
        <DialogTitle className={SHEET_TITLE}>{title}</DialogTitle>
        {description && (
          <DialogDescription className={SHEET_DESCRIPTION}>{description}</DialogDescription>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}
