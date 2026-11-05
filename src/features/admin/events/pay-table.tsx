"use client"

import { StatusBadge, ToggleSwitch } from "@/components/shared"
import type { EventPayRow, PayState } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import { ADMIN_STATUS } from "@/lib/status/admin"
import type { StatusSpec } from "@/lib/status/presets"
import { cn } from "@/lib/utils"

import { TABLE_CARD } from "../common/data-table"

const STATUS: Record<PayState, StatusSpec> = {
  paid: ADMIN_STATUS.paid,
  pending: ADMIN_STATUS.payPending,
  in_review: ADMIN_STATUS.payInReview,
  on_shift: ADMIN_STATUS.onShift,
}

const GRID =
  "grid grid-cols-[2.5rem_minmax(10rem,2fr)_4.5rem_6rem_4.5rem_4.5rem_6rem_8.5rem] items-center gap-3 px-4"

const HEADINGS = ["No.", "Valet", "Hours", "Total", "Paid", "Tips", "Balance", "Status"]

type PayTableProps = {
  rows: EventPayRow[]
  busy: boolean
  onPaid: (row: EventPayRow, paid: boolean) => void
  onTips: (row: EventPayRow, tips: boolean) => void
}

function Switch({
  on,
  label,
  disabled,
  onToggle,
}: {
  on: boolean
  label: string
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-fit border-0 bg-transparent p-0 disabled:opacity-40"
    >
      <ToggleSwitch on={on} />
    </button>
  )
}

/** One row per valet who clocked in: hours, pay, paid and tips switches, balance and status. */
export function PayTable({ rows, busy, onPaid, onTips }: PayTableProps) {
  return (
    <div className={cn(TABLE_CARD, "overflow-x-auto")}>
      <div className="min-w-[52rem]">
        <div
          aria-hidden="true"
          className={cn(
            GRID,
            "h-11 border-b border-line bg-surface text-12 font-semibold tracking-p050 text-fg-3 uppercase",
          )}
        >
          {HEADINGS.map((heading) => (
            <span key={heading}>{heading}</span>
          ))}
        </div>
        <ul aria-label="Valets" className="m-0 list-none p-0">
          {rows.map((row, i) => {
            const payable = row.state === "pending" || row.state === "paid"
            return (
              <li
                key={row.assignmentId}
                className={cn(GRID, "min-h-15 border-b border-line py-2 last:border-b-0")}
              >
                <span className="font-mono text-14 text-fg-3">{i + 1}</span>
                <span className="truncate text-15 font-semibold">{row.name}</span>
                <span className="font-mono text-14">{formatHoursDecimal(row.minutes)}</span>
                <span className="font-mono text-14 font-semibold">
                  {formatMoney(row.amountCents)}
                </span>
                <Switch
                  on={row.state === "paid"}
                  label={`Paid: ${row.name}`}
                  disabled={busy || !payable}
                  onToggle={() => onPaid(row, row.state !== "paid")}
                />
                <Switch
                  on={row.tips}
                  label={`Tips received: ${row.name}`}
                  disabled={busy}
                  onToggle={() => onTips(row, !row.tips)}
                />
                <span className="font-mono text-14">{formatMoney(row.balanceCents)}</span>
                <StatusBadge status={STATUS[row.state]} size="sm" />
              </li>
            )
          })}
          {rows.length === 0 && (
            <li className="px-4 py-8 text-center text-15 text-fg-2">
              No one has clocked in for this event yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
