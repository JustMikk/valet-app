"use client"

import { cn } from "@/lib/utils"

type PillTab<T extends string> = { value: T; label: string; count?: number }

type PillTabsProps<T extends string> = {
  /** Accessible name of the group, e.g. "Show". */
  label: string
  items: PillTab<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

/**
 * Admin page filters (Admin Pages "tabs"): 40 px, 10 px corners, styled like the Live Board's day chips
 * (Regency brand: the selected one is a filled ink pill, the rest plain text), with an optional count bubble. A single-select button group; the selection is `aria-pressed`.
 */
export function PillTabs<T extends string>({
  label,
  items,
  value,
  onValueChange,
  className,
}: PillTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)}
    >
      {items.map((item) => {
        const on = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={on}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "flex h-10 flex-none items-center gap-1.5 rounded-r10 border-0 px-3.5 text-16 transition-[background-color,color] duration-200",
              on
                ? "bg-fg font-semibold text-bg"
                : "bg-transparent font-medium text-fg-2 hover:bg-surface",
            )}
          >
            {item.label}
            {item.count ? (
              <span
                className={cn(
                  "box-border h-5 min-w-5 rounded-pill px-1.5 text-center text-11 leading-5 font-bold",
                  on ? "bg-bg/20 text-bg" : "bg-surface-2 text-fg",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
