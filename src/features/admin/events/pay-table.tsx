"use client"

import { Icon, StatusBadge, ToggleSwitch } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { EventPayRow, PayState } from "@/lib/data"
import { formatHoursDecimal, formatMoney, formatRate } from "@/lib/money/format"
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
  "grid grid-cols-[2.5rem_minmax(10rem,2fr)_4.5rem_6.5rem_6rem_4.5rem_4.5rem_6rem_8.5rem_5.5rem] items-center gap-3 px-4"

const HEADINGS = ["No.", "Valet", "Hours", "Rate", "Total", "Paid", "Tips", "Balance", "Status", ""]

type PayTableProps = {
  rows: EventPayRow[]
  rateCents: number
  busy: boolean
  onPaid: (row: EventPayRow, paid: boolean) => void
  onTips: (row: EventPayRow, tips: boolean) => void
  /** Sends this valet their pay stub (message and notification). */
  onSend: (row: EventPayRow) => void
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

/**
 * One row per valet who clocked in, laid out like the client's sheet: hours, rate, total, paid and
 * tips switches, balance, status, and a button that sends that valet their pay stub.
 */
export function PayTable({ rows, rateCents, busy, onPaid, onTips, onSend }: PayTableProps) {
  return (
    <div className={cn(TABLE_CARD, "overflow-x-auto")}>
      <div className="min-w-248">
        <div
          aria-hidden="true"
          className={cn(
            GRID,
            "h-11 border-b border-line bg-surface text-12 font-semibold tracking-p050 text-fg-3 uppercase",
          )}
        >
          {HEADINGS.map((heading, i) => (
            <span key={`${heading}-${i}`}>{heading}</span>
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
                <span className="font-mono text-14 text-fg-2">{formatRate(rateCents)}</span>
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
                <Button
                  variant="secondary"
                  size="xs"
                  className="gap-1"
                  aria-label={`Send pay stub to ${row.name}`}
                  disabled={busy || row.state === "on_shift"}
                  onClick={() => onSend(row)}
                >
                  <Icon name="send" size={16} />
                  Send
                </Button>
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
