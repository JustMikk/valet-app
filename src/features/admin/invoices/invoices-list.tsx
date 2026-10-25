"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon, PillTabs } from "@/components/shared"
import { formatMoney } from "@/lib/money/format"
import type { Payroll } from "@/lib/data/admin/ops-schemas"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, StatusCell } from "../common/data-table"
import { QueryState } from "../data/query-state"
import { useInvoices, usePayroll, useSendPayroll } from "../data/queries"
import { PayrollStaffRow } from "./pay-stub-modal"

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

function PayrollSummary({ data }: { data: Payroll }) {
  const send = useSendPayroll()
  const [allSent, setAllSent] = useState(false)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-15 font-semibold">{data.period}</span>
          <span className="font-mono text-14 text-fg-2">
            Total est. pay: {formatMoney(data.totalCents)}
          </span>
        </div>
        {allSent ? (
          <span className="text-good flex items-center gap-1.5 text-14 font-semibold">
            <Icon name="check_circle" size={18} className="text-good" filled />
            Sent to all staff
          </span>
        ) : (
          <button
            type="button"
            disabled={send.isPending || data.rows.length === 0}
            onClick={() => send.mutate(undefined, { onSuccess: () => setAllSent(true) })}
            className={cn(
              "text-accent-fg flex items-center gap-2 rounded-pill bg-accent px-3.5 py-2 text-14 font-semibold transition-opacity",
              (send.isPending || data.rows.length === 0) && "opacity-50",
            )}
          >
            <Icon name="send" size={16} />
            {send.isPending ? "Sending…" : "Send to all"}
          </button>
        )}
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
          <PayrollStaffRow key={row.staffId} row={row} period={data.period} />
        ))}
      </div>

      <p className="text-13 text-fg-3">
        Tap any row to view the full pay stub. Estimated at the venue bill rate.
      </p>
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
