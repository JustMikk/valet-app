"use client"

import type { ReactNode } from "react"

import type { EventPay } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import { formatTaxRate } from "@/lib/pay/pay-sheet"
import { cn } from "@/lib/utils"

const CELL = "flex flex-col gap-0.5 rounded-r16 border border-line bg-elev px-3.5 py-2.5"
const LABEL = "text-12 font-semibold tracking-p050 text-fg-3 uppercase"

/** The sheet's head, as on the client's "event / valet schedule": when, where, rate and totals. */
export function PayFacts({ sheet, rate }: { sheet: EventPay; rate: ReactNode }) {
  const facts: [string, ReactNode][] = [
    ["Date", sheet.date],
    ["Start time", sheet.start],
    ["End time", sheet.end],
    ["Event address", sheet.address || sheet.venue],
    ["Total hours", formatHoursDecimal(sheet.totals.minutes)],
    ["Total event amount", formatMoney(sheet.totals.amountCents)],
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 font-display text-22 leading-x120 font-bold tracking-n020">
          {sheet.venue} · {sheet.name}
        </h2>
        <span className="text-14 text-fg-2">Event / valet schedule</span>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-2 tablet:grid-cols-3 desktop:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className={CELL}>
            <dt className={LABEL}>{label}</dt>
            <dd className="m-0 text-15 font-semibold [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
        <div className={cn(CELL, "col-span-2")}>
          <dt className={LABEL}>Per hour</dt>
          <dd className="m-0">{rate}</dd>
        </div>
      </dl>
    </div>
  )
}

/** The sheet's summary: valets, hours, pay before and after tax, paid and pending. */
export function PayTotals({ sheet }: { sheet: EventPay }) {
  const rows: [string, string, boolean?][] = [
    ["Total valets", String(sheet.totals.valets)],
    ["Total hours", formatHoursDecimal(sheet.totals.minutes)],
    ["Total pay before tax", formatMoney(sheet.totals.amountCents)],
    [`Total tax (${formatTaxRate(sheet.taxBp)})`, formatMoney(sheet.totals.taxCents)],
    ["Total pay after tax", formatMoney(sheet.totals.afterTaxCents)],
    ["Total paid", formatMoney(sheet.totals.paidCents)],
    ["Total pending", formatMoney(sheet.totals.pendingCents), true],
  ]
  return (
    <dl className="m-0 flex flex-col rounded-r20 border border-line bg-elev px-4.5 py-1">
      {rows.map(([label, value, strong]) => (
        <div
          key={label}
          className="flex min-h-11 items-center justify-between gap-4 border-b border-line last:border-b-0"
        >
          <dt className={cn("text-14", strong ? "font-semibold" : "text-fg-2")}>{label}</dt>
          <dd className={cn("m-0 font-mono text-15", strong ? "font-bold" : "font-semibold")}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
