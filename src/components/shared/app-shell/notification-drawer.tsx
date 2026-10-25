"use client"

import type { ReactNode } from "react"

import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

import { Icon } from "../icon"
import { SHEET_TITLE } from "../responsive-sheet"

type NotificationDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/**
 * The notification center as a side drawer: slides in from the right over the current page, so
 * looking at alerts never navigates away. Escape, the scrim, a swipe right and the close button
 * dismiss it.
 */
export function NotificationDrawer({ open, onOpenChange, children }: NotificationDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="rounded-l-dialog border-l-0 bg-sheet [backdrop-filter:var(--blur-lg)] duration-320 ease-(--ease-sheet) [--drawer-bleed-background:var(--sheet)] data-[swipe-axis=x]:[--drawer-content-width:min(92vw,26rem)]">
        <div className="flex h-full min-h-0 flex-col gap-3 px-5 pt-[calc(var(--safe-top)+20px)] pb-6">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle className={SHEET_TITLE}>Notifications</DrawerTitle>
            <DrawerClose
              aria-label="Close notifications"
              className="grid size-11 flex-none place-items-center rounded-pill border-0 bg-surface text-fg"
            >
              <Icon name="close" size={22} />
            </DrawerClose>
          </div>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
