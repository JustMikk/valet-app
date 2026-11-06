"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { InvoiceRow } from "@/lib/data/admin/ops-schemas"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, StatusCell, TABLE_CARD } from "../common/data-table"
import { Pager, usePager } from "../common/pager"
import { SummaryBar } from "../common/summary-bar"
import { QueryState } from "../data/query-state"
import { useInvoices, usePayroll, useSendPayroll } from "../data/queries"
import { Money } from "./invoice-parts"
import { PayrollPanel } from "./payroll-panel"

type Tab = "client" | "payroll"

const STAT_CARD = "flex flex-col gap-0.5 rounded-r18 border border-line bg-elev p-3.5"

/** Whole dollars for the totals cards: 595078 → "$5,951". */
const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString("en-US")}`

/** Totals by status, read from the list itself (each row's status label starts with its state). */
function InvoiceStats({ list }: { list: InvoiceRow[] }) {
  const sum = (state: string) => {
    const rows = list.filter((row) => row.status.label.startsWith(state))
    return { cents: rows.reduce((total, row) => total + row.amountCents, 0), count: rows.length }
  }
  const sent = sum("Sent")
  const overdue = sum("Overdue")
  const draft = sum("Draft")
  const paid = sum("Paid")
  const cards: [string, string, boolean?][] = [
    [dollars(sent.cents + overdue.cents), "Outstanding"],
    [dollars(overdue.cents), `Overdue · ${overdue.count}`, overdue.count > 0],
    [dollars(draft.cents), `In draft · ${draft.count}`],
    [dollars(paid.cents), "Paid"],
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-4">
      {cards.map(([value, label, alert]) => (
        <div key={label} className={STAT_CARD}>
          <span
            className={cn(
              "font-display text-28 leading-x110 font-bold tracking-n030 tabular-nums",
              alert && "text-bad",
            )}
          >
            {value}
          </span>
          <span className="truncate text-13 text-fg-2">{label}</span>
        </div>
      ))}
    </div>
  )
}

function ClientInvoices() {
  const invoices = useInvoices()

  return (
    <QueryState query={invoices} rows={4}>
      {(list) => <InvoiceTable list={list} />}
    </QueryState>
  )
}

function InvoiceTable({ list }: { list: InvoiceRow[] }) {
  const pager = usePager(list)
  const overdue = list.filter((row) => row.status.label.startsWith("Overdue"))
  const overdueCents = overdue.reduce((total, row) => total + row.amountCents, 0)
  return (
    <div className="flex flex-col gap-5">
      {overdue.length > 0 && (
        <SummaryBar
          icon="receipt_long"
          tone="bad"
          action={{
            label: overdue.length === 1 ? "Open it" : "Open the oldest",
            href: `/admin/invoices/detail?id=${overdue[overdue.length - 1].id}`,
          }}
        >
          {overdue.length} {overdue.length === 1 ? "invoice is" : "invoices are"} overdue:{" "}
          {dollars(overdueCents)} still to collect.
        </SummaryBar>
      )}
      <div className={TABLE_CARD}>
        <DataHead columns={["Venue · period", "Hours", "Amount", "Status"]} />
        <div className="flex flex-col">
          {list.length === 0 && (
            <p className="py-8 text-center text-15 text-fg-2">No invoices yet.</p>
          )}
          {pager.rows.map((invoice) => (
            <DataRow key={invoice.id} href={`/admin/invoices/detail?id=${invoice.id}`}>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-16 font-semibold">{invoice.venue}</span>
                <span className="truncate text-14 text-fg-2">{invoice.period}</span>
              </span>
              <span className="hidden text-15 font-medium text-fg-2 tabular-nums tablet:block">
                {invoice.hours}
              </span>
              {/* Phone: amount over status at the row's end; from tablet, two columns. */}
              <span className="flex flex-col items-end gap-1 tablet:contents">
                <Money cents={invoice.amountCents} className="text-16 font-semibold" />
                <StatusCell status={invoice.status} className="tablet:justify-self-end" />
              </span>
            </DataRow>
          ))}
        </div>
        <Pager {...pager} />
      </div>
    </div>
  )
}

/** Payroll's one action, beside the tabs: send every pay stub, then say so. */
function SendToAll() {
  const send = useSendPayroll()
  const empty = (usePayroll().data?.rows.length ?? 0) === 0
  const [sent, setSent] = useState(false)
  if (sent) {
    return (
      <span className="flex items-center gap-1.5 text-14 font-semibold text-accent-text">
        <Icon name="check_circle" size={18} filled />
        Sent to all staff
      </span>
    )
  }
  return (
    <Button
      variant="strong"
      size="sm"
      disabled={send.isPending || empty}
      onClick={() => send.mutate(undefined, { onSuccess: () => setSent(true) })}
      className="h-11.5 flex-1 gap-2 bg-accent-text px-5 text-15 text-white tablet:flex-none"
    >
      <Icon name="send" filled size={18} />
      {send.isPending ? "Sending…" : "Send to all"}
    </Button>
  )
}

/** Invoices: client invoices and payroll, with each tab's action beside the tabs. */
export function InvoicesList() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("client")
  const invoices = useInvoices()

  const tabs = [
    { value: "client" as const, label: "Client invoices" },
    { value: "payroll" as const, label: "Payroll" },
  ]

  // The tabs and each tab's action: in the top bar from tablet, over the list on phone.
  const controls = (
    <>
      <PillTabs label="View" items={tabs} value={tab} onValueChange={setTab} />
      {tab === "client" ? (
        <Button
          variant="accent"
          size="sm"
          className="h-11.5 flex-1 gap-1.5 pr-5 pl-3.5 text-15 tablet:flex-none"
          onClick={() => router.push("/admin/invoices/new")}
        >
          <Icon name="add" size={22} />
          <span className="tablet:hidden">New</span>
          <span className="hidden tablet:inline">New invoice</span>
        </Button>
      ) : (
        <SendToAll />
      )}
    </>
  )

  return (
    <AdminPage>
      <AdminHead
        title="Invoices"
        sub="Drafted when an event's hours are approved"
        tools={controls}
      />
      {invoices.data && <InvoiceStats list={invoices.data} />}
      {/* Desktop: the list in one white card (Regency mockup); phone: flat on the page. */}
      <div className="flex flex-col gap-5 desktop:rounded-r24 desktop:border desktop:border-line desktop:bg-elev desktop:p-6">
        <div className="flex items-center justify-between gap-3 tablet:hidden">{controls}</div>
        {tab === "client" ? <ClientInvoices /> : <PayrollPanel />}
      </div>
    </AdminPage>
  )
}
