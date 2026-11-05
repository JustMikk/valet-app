"use client"

import { createContext, useContext } from "react"

import { Icon } from "@/components/shared"

/**
 * The admin top bar (Regency mockups): one full-width white bar on tablet and desktop, drawn by
 * the shell and aligned left like the Live Board's, with Back on sub-pages. Pages put their heading into it through AdminHead, which
 * portals into the slot below; on phone the heading stays inline under the floating chrome.
 */
const TopBarSlot = createContext<HTMLElement | null>(null)

export const TopBarSlotProvider = TopBarSlot.Provider

/** The bar's heading slot, or null outside the admin shell (the heading then stays inline). */
export function useTopBarSlot() {
  return useContext(TopBarSlot)
}

type AdminTopBarProps = {
  isRoot: boolean
  onBack: () => void
  /** Receives the element pages portal their heading into. */
  slotRef: (element: HTMLElement | null) => void
}

export function AdminTopBar({ isRoot, onBack, slotRef }: AdminTopBarProps) {
  return (
    <div className="hidden border-b border-line bg-elev tablet:block">
      <div className="box-border flex min-h-23 w-full items-center gap-4 px-8 py-5">
        {!isRoot && (
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="grid size-11 flex-none place-items-center rounded-pill border-0 bg-surface text-fg"
          >
            <Icon name="arrow_back" size={22} />
          </button>
        )}
        <div ref={slotRef} className="flex min-w-0 flex-1 items-center" />
      </div>
    </div>
  )
}
