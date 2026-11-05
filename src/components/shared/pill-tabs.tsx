"use client"

import { cn } from "@/lib/utils"

type PillTab<T extends string> = { value: T; label: string; count?: number }

type PillTabsProps<T extends string> = {
  /** Accessible name of the group, e.g. "Show". */
  label: string
  items: PillTab<T>[]
  value: T
  onValueChange: (value: T) => void
  /** `sm` is the Live Board column headers: 34 px, 14 px labels. */
  size?: "md" | "sm"
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
  size = "md",
  className,
}: PillTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "no-scrollbar flex overflow-x-auto",
        size === "sm" ? "gap-1" : "gap-2",
        className,
      )}
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
              "flex flex-none items-center gap-1.5 rounded-r10 border-0 transition-[background-color,color] duration-200",
              size === "sm" ? "h-8.5 gap-1 px-2.5 text-14" : "h-10 px-3.5 text-16",
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
