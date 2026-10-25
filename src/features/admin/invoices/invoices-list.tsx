"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon, PersonAvatar, PillTabs } from "@/components/shared"
import { formatMoney } from "@/lib/money/format"
import type { Payroll, PayrollRow } from "@/lib/data/admin/ops-schemas"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, StatusCell } from "../common/data-table"
import { QueryState } from "../data/query-state"
import { useInvoices, usePayroll, useSendPayroll } from "../data/queries"

type Tab = "client" | "payroll"

function ClientInvoices() {
  const invoices = useInvoices()

  return (
    <QueryState query={invoices} rows={4}>
      {(list) => (
        <div className="flex flex-col gap-3.5">
          <DataHead columns={["Venue · period", "Status", "Hours", "Amount"]} />
          <div className="flex flex-col border-t border-line">
            {list.length === 0 && (
              <p className="py-8 text-center text-15 text-fg-2">No invoices yet.</p>
            )}
            {list.map((invoice) => (
              <DataRow key={invoice.id} href={`/admin/invoices/detail?id=${invoice.id}`}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-16 font-semibold">{invoice.venue}</span>
                  <span className="truncate text-14 text-fg-2">{invoice.period}</span>
                </span>
                <StatusCell status={invoice.status} />
                <span className="hidden font-mono text-15 font-medium text-fg-2 tablet:block">
                  {invoice.hours}
                </span>
                <span className="text-right font-mono text-16 font-semibold">
                  {formatMoney(invoice.amountCents)}
                </span>
              </DataRow>
            ))}
          </div>
        </div>
      )}
    </QueryState>
  )
}

/** Expandable row: summary + per-event lines on tap. */
function PayrollStaffRow({ row }: { row: PayrollRow }) {
  const [open, setOpen] = useState(false)
  const send = useSendPayroll()

  return (
    <div className="border-b border-line">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-15 w-full items-center gap-3 px-0 text-left"
      >
        <PersonAvatar name={row.name} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-15 font-semibold">{row.name}</span>
          <span className="text-13 text-fg-3">{row.email}</span>
        </span>
        <span className="hidden w-12 text-right font-mono text-14 text-fg-2 tablet:block">
          {row.shifts}
        </span>
        <span className="w-16 text-right font-mono text-14 text-fg-2">{row.hours}h</span>
        <span className="w-20 text-right font-mono text-15 font-semibold">
          {formatMoney(row.amountCents)}
        </span>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          size={20}
          className="shrink-0 text-fg-3"
        />
      </button>

      {/* Expanded: per-event lines + send button */}
      {open && (
        <div className="flex flex-col gap-2 pt-1 pb-3">
          {row.lines.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-card bg-surface-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line px-3 py-2 text-13 font-medium text-fg-3">
                <span>Event</span>
                <span>Date</span>
                <span className="text-right">Hours</span>
                <span className="text-right">Amount</span>
              </div>
              {row.lines.map((line, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line px-3 py-2.5 text-14 last:border-0"
                >
                  <span className="truncate font-medium">{line.event}</span>
                  <span className="font-mono text-13 text-fg-2">{line.date}</span>
                  <span className="text-right font-mono text-fg-2">{line.hours}h</span>
                  <span className="text-right font-mono font-semibold">
                    {formatMoney(line.amountCents)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-line bg-surface px-3 py-2 text-14 font-semibold">
                <span>Total</span>
                <span />
                <span className="text-right font-mono">{row.hours}h</span>
                <span className="text-right font-mono">{formatMoney(row.amountCents)}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            disabled={send.isPending}
            onClick={() => send.mutate()}
            className={cn(
              "flex items-center gap-2 self-start rounded-pill border border-line bg-surface px-3.5 py-2 text-14 font-semibold transition-opacity",
              send.isPending && "opacity-50",
            )}
          >
            <Icon name="send" size={16} className="text-accent-text" />
            {send.isPending ? "Sending…" : `Send pay stub to ${row.name.split(" ")[0]}`}
          </button>
        </div>
      )}
    </div>
  )
}

function PayrollSummary({ data }: { data: Payroll }) {
  const send = useSendPayroll()

  const downloadPdf = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header: period + totals + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-15 font-semibold">{data.period}</span>
          <span className="font-mono text-14 text-fg-2">
            Total est. pay: {formatMoney(data.totalCents)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            className="flex items-center gap-2 rounded-pill border border-line bg-surface px-3.5 py-2 text-14 font-semibold"
          >
            <Icon name="download" size={16} className="text-fg-2" />
            PDF
          </button>
          <button
            type="button"
            disabled={send.isPending || data.rows.length === 0}
            onClick={() => send.mutate()}
            className={cn(
              "text-accent-fg flex items-center gap-2 rounded-pill bg-accent px-3.5 py-2 text-14 font-semibold transition-opacity",
              (send.isPending || data.rows.length === 0) && "opacity-50",
            )}
          >
            <Icon name="send" size={16} />
            {send.isPending ? "Sending…" : "Send to all"}
          </button>
        </div>
      </div>

      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 border-b border-line pb-2 text-13 font-medium text-fg-3 tablet:grid">
        <span>Staff member</span>
        <span className="w-12 text-right">Shifts</span>
        <span className="w-16 text-right">Hours</span>
        <span className="w-20 text-right">Est. pay</span>
        <span className="w-5" />
      </div>

      <div className="flex flex-col">
        {data.rows.length === 0 && (
          <p className="py-8 text-center text-15 text-fg-2">No approved hours this period yet.</p>
        )}
        {data.rows.map((row) => (
          <PayrollStaffRow key={row.staffId} row={row} />
        ))}
      </div>

      <p className="text-13 text-fg-3">
        Estimated at the venue bill rate — adjust for your actual pay rate.
      </p>

      {/* Print stylesheet: renders a clean payroll statement */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .payroll-print { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function PayrollLoader() {
  const payroll = usePayroll()
  return (
    <QueryState query={payroll} rows={4}>
      {(data) => <PayrollSummary data={data} />}
    </QueryState>
  )
}

/** Invoices: client invoices and payroll summary, side by side with tabs. */
export function InvoicesList() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("client")

  const tabs = [
    { value: "client" as const, label: "Client invoices" },
    { value: "payroll" as const, label: "Payroll" },
  ]

  return (
    <AdminPage>
      <AdminHead
        title="Invoices"
        sub="Drafted when an event's hours are approved"
        cta={
          tab === "client"
            ? {
                label: "New invoice",
                icon: "request_quote",
                onClick: () => router.push("/admin/invoices/new"),
              }
            : undefined
        }
      />
      <PillTabs label="View" items={tabs} value={tab} onValueChange={setTab} />
      {tab === "client" ? <ClientInvoices /> : <PayrollLoader />}
    </AdminPage>
  )
}
