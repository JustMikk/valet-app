import Link from "next/link"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type TabItem = {
  key: string
  label: string
  icon: IconName
  /** Unread or pending count shown on the tab. */
  badge?: number
} & ({ href: string; onSelect?: never } | { onSelect: (key: string) => void; href?: never })

type TabBarProps = {
  /** Accessible name of the navigation landmark. */
  label: string
  items: TabItem[]
  /** Key of the current tab. */
  current: string
  className?: string
}

const ITEM =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-pill border-0 bg-transparent text-fg no-underline transition-[background-color,transform] duration-200 active:scale-94 aria-[current=page]:bg-surface"

function TabContent({ item }: { item: TabItem }) {
  return (
    <>
      <Icon name={item.icon} filled size={26} />
      <span className="text-12 font-semibold">{item.label}</span>
      {item.badge ? (
        <>
          <span
            aria-hidden="true"
            className="absolute top-1 left-[calc(50%+6px)] h-4.5 min-w-4.5 rounded-pill bg-fg px-1 text-center text-11 leading-4.5 font-bold text-bg"
          >
            {item.badge}
          </span>
          <span className="sr-only">{`, ${item.badge} new`}</span>
        </>
      ) : null}
    </>
  )
}

/** Floating glass tab bar for phone (Staff PWA / Admin shells): 76 px, active = surface pill. */
export function TabBar({ label, items, current, className }: TabBarProps) {
  return (
    <nav aria-label={label} className={cn("flex h-19 gap-1 rounded-pill glass p-1.75", className)}>
      {items.map((item) => {
        const currentProps = item.key === current ? { "aria-current": "page" as const } : {}
        return item.href ? (
          <Link key={item.key} href={item.href} className={ITEM} {...currentProps}>
            <TabContent item={item} />
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={() => item.onSelect?.(item.key)}
            className={ITEM}
            {...currentProps}
          >
            <TabContent item={item} />
          </button>
        )
      })}
    </nav>
  )
}
