"use client"

import Image from "next/image"
import { useSearchParams } from "next/navigation"

import { GlassCard, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { InvoiceDetail as InvoiceData } from "@/lib/data"
import { formatHoursDecimal, formatMoney, formatRate } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { AdminPage, FORM } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useInvoice, useSendInvoice, useSession } from "../data/queries"
import { invoiceNumber, invoicePdf } from "./invoice-pdf"

/** One invoice: lines from approved hours, total and send. `?id=` picks it (default: first draft). */
export function InvoiceDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const invoice = useInvoice(id)
  return (
    <AdminPage>
      <QueryState query={invoice} rows={3}>
        {(data) => <InvoiceBody invoice={data} />}
      </QueryState>
    </AdminPage>
  )
}

/** Saves the invoice as a PDF file named after its number. */
function downloadPdf(invoice: InvoiceData, company: string) {
  const blob = new Blob([invoicePdf(invoice, company)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${invoiceNumber(invoice.number)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

function InvoiceBody({ invoice }: { invoice: InvoiceData }) {
  const send = useSendInvoice()
  const company = useSession().data?.admin.company ?? "Invoice"

  return (
    <div className={FORM}>
      <GlassCard className="flex flex-col gap-4.5 rounded-r28 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-13 font-semibold text-fg-3">{invoice.number}</span>
            <h1 className="m-0 font-display text-30 leading-x110 font-bold tracking-n030">
              {invoice.venue}
            </h1>
            <span className="text-15 text-fg-2">{invoice.period}</span>
          </div>
          <Image
            src="/brand/regency-logo.png"
            alt=""
            width={79}
            height={44}
            className="h-11 w-auto"
          />
        </div>
        <ul className="m-0 flex list-none flex-col border-t border-line p-0">
          {invoice.lines.map((line) => (
            <li
              key={line.what}
              className="box-content flex min-h-15 items-center gap-3 border-b border-line"
            >
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-15 font-semibold">{line.what}</span>
                {line.detail && <span className="text-13 text-fg-2">{line.detail}</span>}
                <span className="text-13 text-fg-2">
                  {!line.detail && `${line.staffCount} staff · `}
                  {formatHoursDecimal(line.minutes)} × {formatRate(line.rateCents)}
                </span>
              </div>
              <span className="font-mono text-15 font-semibold">
                {formatMoney(line.amountCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between">
          <span className="text-16 font-medium">Total due</span>
          <span className="font-display text-40 leading-x100 font-bold tracking-n035">
            {formatMoney(invoice.totalCents)}
          </span>
        </div>
        {invoice.notice && (
          <span className="flex items-start gap-2 text-14 leading-x140 font-medium text-warn">
            <Icon name="info" filled size={18} />
            {invoice.notice}
          </span>
        )}
      </GlassCard>
      {send.error && <ErrorNotice message={send.error.message} />}
      <div className="flex gap-2.5">
        <Button
          variant="secondary"
          className="flex-1 gap-1.5 text-16"
          onClick={() => downloadPdf(invoice, company)}
        >
          <Icon name="download" size={22} />
          PDF
        </Button>
        <Button
          variant="accent"
          disabled={invoice.sent || send.isPending}
          onClick={() => send.mutate(invoice.id)}
          className={cn(
            "flex-2 text-17 transition-colors duration-300",
            invoice.sent && "bg-ok text-white disabled:bg-ok disabled:text-white",
          )}
        >
          {invoice.sent ? `Sent to ${invoice.billedTo}` : "Send invoice"}
        </Button>
      </div>
    </div>
  )
}
