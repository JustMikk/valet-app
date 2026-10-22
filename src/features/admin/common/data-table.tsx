import type { ReactNode } from "react"
import Link from "next/link"

import { Icon, PersonAvatar, StatusBadge } from "@/components/shared"
import type { StatusSpec } from "@/lib/status/presets"
import { cn } from "@/lib/utils"

/** Four-column table grid from tablet up; on phone the row is a name column and one trailing cell. */
const COLUMNS =
  "tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] tablet:gap-4"

/** Column headings, shown from tablet up only. */
export function DataHead({ columns }: { columns: [string, string, string, string] }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden px-1 text-13 font-semibold tracking-p020 text-fg-3 tablet:grid",
        COLUMNS,
      )}
    >
      <span>{columns[0]}</span>
      <span>{columns[1]}</span>
      <span>{columns[2]}</span>
      <span className="text-right">{columns[3]}</span>
    </div>
  )
}

/** Link row of the table: 72 px, hairline separated, press scale. */
export function DataRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "box-content grid min-h-18 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-2 text-left text-fg no-underline transition-transform duration-160 active:scale-99 tablet:px-1",
        COLUMNS,
      )}
    >
      {children}
    </Link>
  )
}

/** Name cell: avatar plus two lines. */
export function PersonCell({ name, sub }: { name: string; sub: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <PersonAvatar name={name} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-16 font-semibold">{name}</span>
        <span className="truncate text-14 text-fg-2">{sub}</span>
      </span>
    </span>
  )
}

/** Status chip in a table cell. */
export function StatusCell({ status }: { status: StatusSpec }) {
  return <StatusBadge status={status} size="sm" className="self-center justify-self-start" />
}

/** Chevron that marks a row as navigable on phone, where the amount column is hidden. */
export function RowChevron() {
  return <Icon name="chevron_right" size={24} className="text-fg-2 tablet:hidden" />
}
