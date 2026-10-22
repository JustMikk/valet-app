"use client"

import { useRouter } from "next/navigation"

import { INVOICES } from "@/mocks/admin"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, StatusCell } from "../common/data-table"

/** Invoices: a venue / period table with status and amount; rows open the invoice. */
export function InvoicesList() {
  const router = useRouter()

  return (
    <AdminPage>
      <AdminHead
        title="Invoices"
        sub="Built from approved hours"
        cta={{
          label: "New invoice",
          icon: "request_quote",
          onClick: () => router.push("/admin/invoices/detail"),
        }}
      />
      <div className="flex flex-col gap-3.5">
        <DataHead columns={["Venue · period", "Status", "Hours", "Amount"]} />
        <div className="flex flex-col border-t border-line">
          {INVOICES.map((invoice) => (
            <DataRow key={`${invoice.venue}-${invoice.period}`} href="/admin/invoices/detail">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-16 font-semibold">{invoice.venue}</span>
                <span className="truncate text-14 text-fg-2">{invoice.period}</span>
              </span>
              <StatusCell status={invoice.status} />
              <span className="hidden font-mono text-15 font-medium text-fg-2 tablet:block">
                {invoice.hours}
              </span>
              <span className="text-right font-mono text-16 font-semibold">{invoice.amount}</span>
            </DataRow>
          ))}
        </div>
      </div>
    </AdminPage>
  )
}
