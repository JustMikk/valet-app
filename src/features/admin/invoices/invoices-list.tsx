"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { PersonAvatar, PillTabs } from "@/components/shared"
import { formatMoney } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, StatusCell } from "../common/data-table"
import { QueryState } from "../data/query-state"
import { useInvoices, usePayroll } from "../data/queries"

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

function PayrollSummary() {
  const payroll = usePayroll()

  return (
    <QueryState query={payroll} rows={4}>
      {(data) => (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-14 font-medium text-fg-2">{data.period}</span>
            <span className="font-mono text-15 font-semibold">
              Total: {formatMoney(data.totalCents)}
            </span>
          </div>
          <DataHead columns={["Staff member", "Shifts", "Hours", "Est. pay"]} />
          <div className="flex flex-col border-t border-line">
            {data.rows.length === 0 && (
              <p className="py-8 text-center text-15 text-fg-2">
                No approved hours this period yet.
              </p>
            )}
            {data.rows.map((row) => (
              <div
                key={row.staffId}
                className="box-content flex min-h-15 items-center gap-3 border-b border-line"
              >
                <PersonAvatar name={row.name} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-15 font-semibold">{row.name}</span>
                </span>
                <span
                  className={cn(
                    "hidden w-14 text-right font-mono text-14 font-medium text-fg-2 tablet:block",
                  )}
                >
                  {row.shifts}
                </span>
                <span className="w-16 text-right font-mono text-14 font-medium text-fg-2">
                  {row.hours}h
                </span>
                <span className="w-20 text-right font-mono text-15 font-semibold">
                  {formatMoney(row.amountCents)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-13 text-fg-3">
            Estimated at the venue bill rate — adjust for your actual pay rate.
          </p>
        </div>
      )}
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
      {tab === "client" ? <ClientInvoices /> : <PayrollSummary />}
    </AdminPage>
  )
}
