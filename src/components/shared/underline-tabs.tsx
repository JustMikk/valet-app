"use client"

import type { ReactNode } from "react"
import { Tabs } from "@base-ui/react/tabs"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type TabItem = { value: string; label: ReactNode; icon?: IconName }

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
 * Underline tabs (Design System "tabs · underline", Staff Shifts): 19 px labels with an optional
 * leading icon, 3 px accent indicator over a hairline (Regency brand, ADR-020). Composes the Base UI Tabs primitive that shadcn's tabs wraps;
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
            className="-mb-px inline-flex items-center gap-2 border-0 border-b-3 border-transparent bg-transparent px-0.5 pb-3.5 text-19 leading-x100 font-medium text-fg-3 data-active:border-accent data-active:font-semibold data-active:text-fg"
          >
            {item.icon && <Icon name={item.icon} filled size={22} />}
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
