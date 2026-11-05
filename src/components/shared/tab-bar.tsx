import Link from "next/link"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type TabItem = {
  key: string
  label: string
  icon: IconName
  /** Unread or pending count shown on the tab. */
  badge?: number | string
  /** Staff app badges are `fg`; the admin Live tab uses `bad` (crimson, Regency brand). */
  badgeTone?: "fg" | "warn" | "bad"
} & ({ href: string; onSelect?: never } | { onSelect: (key: string) => void; href?: never })

type TabBarProps = {
  /** Accessible name of the navigation landmark. */
  label: string
  items: TabItem[]
  /** Key of the current tab. */
  current: string | null
  /** `admin` is the five-tab variant: 25 px glyphs, 11 px labels, 2 px gaps. */
  size?: "staff" | "admin"
  className?: string
}

const ITEM =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-pill border-0 bg-transparent text-fg no-underline transition-[background-color,transform] duration-200 active:scale-94 aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-text"

const SIZES = {
  staff: {
    bar: "gap-1",
    glyph: 26,
    label: "text-12",
    badge: "top-1 left-[calc(50%+6px)]",
  },
  admin: {
    bar: "gap-0.5",
    glyph: 25,
    label: "text-11",
    badge: "top-0.75 left-[calc(50%+5px)]",
  },
} as const

const BADGE_TONE = {
  fg: "bg-fg text-bg",
  warn: "bg-warn text-white",
  bad: "bg-bad text-white",
} as const

function TabContent({ item, size }: { item: TabItem; size: keyof typeof SIZES }) {
  const s = SIZES[size]
  return (
    <>
      <Icon name={item.icon} filled size={s.glyph} />
      <span className={cn("font-semibold", s.label)}>{item.label}</span>
      {item.badge ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-4.5 min-w-4.5 rounded-pill px-1 text-center text-11 leading-4.5 font-bold",
              s.badge,
              BADGE_TONE[item.badgeTone ?? "fg"],
            )}
          >
            {item.badge}
          </span>
          <span className="sr-only">{`, ${item.badge} new`}</span>
        </>
      ) : null}
    </>
  )
}

/** Floating glass tab bar for phone (Staff PWA / Admin shells): 76 px, active = accent pill. */
export function TabBar({ label, items, current, size = "staff", className }: TabBarProps) {
  return (
    <nav
      aria-label={label}
      className={cn("flex h-19 rounded-pill glass p-1.75", SIZES[size].bar, className)}
    >
      {items.map((item) => {
        const currentProps = item.key === current ? { "aria-current": "page" as const } : {}
        return item.href ? (
          <Link key={item.key} href={item.href} className={ITEM} {...currentProps}>
            <TabContent item={item} size={size} />
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={() => item.onSelect?.(item.key)}
            className={ITEM}
            {...currentProps}
          >
            <TabContent item={item} size={size} />
          </button>
        )
      })}
    </nav>
  )
}
