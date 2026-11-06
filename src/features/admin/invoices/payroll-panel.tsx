"use client"

import { useState } from "react"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { Payroll, PayrollEventRow } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { StatusCell, TABLE_CARD } from "../common/data-table"
import { QueryState } from "../data/query-state"
import { usePayrollEvents } from "../data/pay-queries"
import { usePayroll } from "../data/queries"
import { PaySheet } from "../events/pay-sheet"
import { PayrollStaffRow } from "./pay-stub-modal"

type View = "valets" | "events"

const VIEWS = [
  { value: "valets" as const, label: "By valet" },
  { value: "events" as const, label: "By event" },
]

/** Payroll two ways: each valet's pay this period, or each finished event's valet sheet. */
export function PayrollPanel() {
  const [view, setView] = useState<View>("valets")
  return (
    <div className="flex flex-col gap-4">
      <PillTabs label="Payroll view" size="sm" items={VIEWS} value={view} onValueChange={setView} />
      {view === "valets" ? <PayrollByValet /> : <PayrollByEvent />}
    </div>
  )
}

function PayrollByValet() {
  const payroll = usePayroll()
  return (
    <QueryState query={payroll} rows={4}>
      {(data) => <ValetList data={data} />}
    </QueryState>
  )
}

function ValetList({ data }: { data: Payroll }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-15 font-semibold">{data.period}</span>
        <span className="text-14 text-fg-2 tabular-nums">
          Total pay: {formatMoney(data.totalCents)} · Pending:{" "}
          {formatMoney(data.rows.reduce((sum, row) => sum + row.pendingCents, 0))}
        </span>
      </div>

      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 border-b border-line pb-2 text-13 font-medium text-fg-3 tablet:grid">
        <span>Staff member</span>
        <span className="w-12 text-right">Shifts</span>
        <span className="w-16 text-right">Hours</span>
        <span className="w-20 text-right">Pay</span>
        <span className="w-5" />
      </div>

      <div className="flex flex-col">
        {data.rows.length === 0 && (
          <p className="py-8 text-center text-15 text-fg-2">No approved hours this period yet.</p>
        )}
        {data.rows.map((row) => (
          <PayrollStaffRow key={row.staffId} row={row} period={data.period} />
        ))}
      </div>

      <p className="text-13 text-fg-3">
        Tap any row to view the full pay stub. At each event&apos;s valet pay rate.
      </p>
    </div>
  )
}

function PayrollByEvent() {
  const events = usePayrollEvents()
  const [openId, setOpenId] = useState<string | null>(null)
  if (openId) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="secondary"
          size="xs"
          className="gap-1 self-start"
          onClick={() => setOpenId(null)}
        >
          <Icon name="arrow_back" size={18} />
          All events
        </Button>
        <PaySheet eventId={openId} />
      </div>
    )
  }
  return (
    <QueryState query={events} rows={4}>
      {(list) => <EventList list={list} onOpen={setOpenId} />}
    </QueryState>
  )
}

const EVENT_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(8.5rem,auto)] tablet:gap-4"

function EventList({ list, onOpen }: { list: PayrollEventRow[]; onOpen: (id: string) => void }) {
  return (
    <div className={TABLE_CARD}>
      <div
        aria-hidden="true"
        className={cn(
          EVENT_GRID,
          "hidden h-11 border-b border-line bg-surface px-5 text-12 font-semibold tracking-p050 text-fg-3 uppercase tablet:grid",
        )}
      >
        <span>Finished event</span>
        <span>Valets · hours</span>
        <span>Total · pending</span>
        <span className="text-right">Status</span>
      </div>
      {list.length === 0 && (
        <p className="py-8 text-center text-15 text-fg-2">
          No finished events with clocked hours yet.
        </p>
      )}
      {list.map((event) => (
        <button
          key={event.eventId}
          type="button"
          onClick={() => onOpen(event.eventId)}
          className={cn(
            EVENT_GRID,
            "min-h-18 w-full border-0 border-b border-line bg-transparent px-4 py-2 text-left text-fg transition-colors duration-160 last:border-b-0 hover:bg-surface/60 tablet:px-5",
          )}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-16 font-semibold">
              {event.venue} · {event.name}
            </span>
            <span className="truncate text-14 text-fg-2">
              {event.date} · {event.time}
            </span>
          </span>
          <span className="hidden text-15 text-fg-2 tabular-nums tablet:block">
            {event.valets} · {formatHoursDecimal(event.minutes)}
          </span>
          <span className="hidden flex-col tabular-nums tablet:flex">
            <span className="text-15 font-semibold">{formatMoney(event.amountCents)}</span>
            <span className="text-13 text-fg-2">{formatMoney(event.pendingCents)} pending</span>
          </span>
          <StatusCell status={event.status} className="justify-self-end" />
        </button>
      ))}
    </div>
  )
}
