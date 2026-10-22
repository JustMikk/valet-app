"use client"

import type { ReactNode } from "react"
import { Tabs } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

type TabItem = { value: string; label: ReactNode }

type UnderlineTabsProps = {
  items: TabItem[]
  /** Accessible name of the tab list. */
  label: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** UnderlineTabPanel elements. */
  children?: ReactNode
  className?: string
  listClassName?: string
}

/**
 * Underline tabs (Design System "tabs · underline", Staff Shifts): 19 px labels, 3 px fg
 * indicator over a hairline. Composes the Base UI Tabs primitive that shadcn's tabs wraps;
 * shadcn's line variant draws a 2 px pseudo-element indicator (DESIGN_INTAKE).
 */
export function UnderlineTabs({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  listClassName,
}: UnderlineTabsProps) {
  return (
    <Tabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(String(next))}
      className={cn("flex flex-col", className)}
    >
      <Tabs.List
        aria-label={label}
        className={cn("flex gap-7 border-b border-line", listClassName)}
      >
        {items.map((item) => (
          <Tabs.Tab
            key={item.value}
            value={item.value}
            className="-mb-px border-0 border-b-3 border-transparent bg-transparent px-0.5 pb-3.5 text-19 leading-x100 font-medium text-fg-3 data-active:border-fg data-active:font-semibold data-active:text-fg"
          >
            {item.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  )
}

export function UnderlineTabPanel({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  return (
    <Tabs.Panel value={value} className={className}>
      {children}
    </Tabs.Panel>
  )
}
