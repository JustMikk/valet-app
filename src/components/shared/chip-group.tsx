"use client"

import type { ReactNode } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type ChipItem<T extends string> = { value: T; label: ReactNode }

type ChipGroupProps<T extends string> = {
  /** Accessible name of the group, e.g. "Day". */
  label: string
  items: ChipItem<T>[]
  value: T
  onValueChange: (value: T) => void
  /** Action after the chips, pushed to the end (e.g. a filter icon button). */
  trailing?: ReactNode
  className?: string
}

/** Single-select filter / range chips (Design System "chip-group"). Always keeps one selected. */
export function ChipGroup<T extends string>({
  label,
  items,
  value,
  onValueChange,
  trailing,
  className,
}: ChipGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <ToggleGroup
        aria-label={label}
        spacing={1.5}
        value={[value]}
        onValueChange={(next) => {
          const picked = items.find((item) => next.includes(item.value))
          if (picked) onValueChange(picked.value)
        }}
        className="flex-wrap"
      >
        {items.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}
