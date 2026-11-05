import type { ReactNode } from "react"
import Link from "next/link"

import { Icon, PersonAvatar, StatusBadge } from "@/components/shared"
import type { StatusSpec } from "@/lib/status/presets"
import { cn } from "@/lib/utils"

/** Four-column table grid from tablet up; on phone the row is a name column and one trailing cell. */
const COLUMNS =
  "tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] tablet:gap-4"

/** The table's frame: a white card with a hairline, its rows divided by faint lines. */
export const TABLE_CARD = "flex flex-col overflow-hidden rounded-r24 border border-line bg-elev"

/** Column headings on a light grey band, shown from tablet up only. */
export function DataHead({ columns }: { columns: [string, string, string, string] }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden h-11 items-center border-b border-line bg-surface px-5 text-12 font-semibold tracking-p050 text-fg-3 uppercase tablet:grid",
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

/** Link row of the table: 68 px, hairline separated, a grey wash on hover. */
export function DataRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "box-content grid min-h-17 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-1.5 text-left text-fg no-underline transition-colors duration-160 last:border-b-0 hover:bg-surface/60 active:bg-surface tablet:px-5",
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
export function StatusCell({ status, className }: { status: StatusSpec; className?: string }) {
  return (
    <StatusBadge
      status={status}
      size="sm"
      className={cn("self-center justify-self-start", className)}
    />
  )
}

/** Chevron that marks a row as navigable on phone, where the amount column is hidden. */
export function RowChevron() {
  return <Icon name="chevron_right" size={24} className="text-fg-2 tablet:hidden" />
}
