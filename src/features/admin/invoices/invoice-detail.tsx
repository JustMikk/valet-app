"use client"

import Image from "next/image"
import { useSearchParams } from "next/navigation"

import { Icon, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { InvoiceDetail as InvoiceData } from "@/lib/data"
import { formatHoursDecimal, formatRate } from "@/lib/money/format"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useInvoice, useSendInvoice, useSession } from "../data/queries"
import {
  ACTION_BAR,
  InvoiceDetails,
  InvoiceFacts,
  Money,
  splitInvoiceNumber,
} from "./invoice-parts"
import { invoiceNumber, invoicePdf } from "./invoice-pdf"
import { BRAND_LOGO } from "@/lib/brand"

/** One invoice: lines from approved hours, total and send. `?id=` picks it (default: first draft). */
export function InvoiceDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const invoice = useInvoice(id)
  return (
    <AdminPage>
      {invoice.data && (
        // The card already names the venue on phone, so the heading lives in the top bar only.
        <AdminHead
          inline={false}
          title={invoice.data.venue}
          crumb={{
            label: "Invoices",
            href: "/admin/invoices",
            current: splitInvoiceNumber(invoice.data.number).number,
          }}
        />
      )}
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
  const { number, status } = splitInvoiceNumber(invoice.number)

  return (
    <div className="grid w-full max-w-260 items-start gap-5 pb-24 desktop:grid-cols-[minmax(0,1fr)_20rem] desktop:gap-6 desktop:pb-0">
      <div className="flex min-w-0 flex-col gap-5">
        <article className="flex flex-col gap-4.5 rounded-r28 border border-line bg-elev p-5 tablet:p-7">
          <div className="flex items-center justify-between gap-3 rounded-r18 bg-hero px-4.5 py-4">
            <Image
              src={BRAND_LOGO.src}
              alt="Regency Parking Service"
              width={BRAND_LOGO.width}
              height={BRAND_LOGO.height}
              className="h-9 w-auto tablet:h-11"
            />
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="text-11 font-semibold tracking-p060 text-accent uppercase">
                Invoice
              </span>
              <span className="text-15 font-semibold whitespace-nowrap text-hero-fg tabular-nums">
                {number}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="m-0 font-display text-22 leading-x120 font-bold tracking-n020 tablet:text-26">
                {invoice.venue}
              </h1>
              {status && <StatusBadge status={status} size="sm" className="flex-none" />}
            </div>
            <InvoiceFacts period={invoice.period} event={Boolean(invoice.eventId)} />
          </div>

          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {invoice.lines.map((line) => (
              <li
                key={`${line.what}-${line.detail ?? ""}`}
                className="box-content flex min-h-15 items-center gap-3 border-b border-line py-2"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-15 font-semibold">{line.what}</span>
                  <span className="text-13 text-fg-2 tabular-nums">
                    {!line.detail && `${line.staffCount} staff · `}
                    {formatHoursDecimal(line.minutes)} × {formatRate(line.rateCents)}
                  </span>
                </div>
                <div className="flex flex-none flex-col items-end gap-0.5 text-right">
                  <Money cents={line.amountCents} className="text-15 font-semibold" />
                  {line.detail && (
                    <span className="text-12 whitespace-nowrap text-fg-2">{line.detail}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 rounded-r16 bg-surface px-4.5 py-4">
            <span className="text-18 font-semibold">Total Due</span>
            <Money
              cents={invoice.totalCents}
              className="font-display text-28 leading-x100 font-bold tablet:text-32"
              centsClassName="text-14"
            />
          </div>
          {invoice.notice && (
            <span className="flex items-start gap-2 rounded-r16 bg-accent-soft px-4 py-3 text-14 leading-x140 font-medium text-accent-text">
              <Icon name="info" filled size={18} />
              {invoice.notice}
            </span>
          )}
        </article>
        {send.error && <ErrorNotice message={send.error.message} />}
      </div>
      <aside className="flex flex-col gap-4 desktop:sticky desktop:top-6">
        <div className={ACTION_BAR}>
          <Button
            variant="secondary"
            className="flex-1 gap-1.5 text-16"
            onClick={() => downloadPdf(invoice, company)}
          >
            <Icon name="download" size={22} />
            PDF
          </Button>
          <Button
            variant="strong"
            disabled={invoice.sent || send.isPending}
            onClick={() => send.mutate(invoice.id)}
            className={cn(
              "flex-2 gap-1.5 bg-accent-text text-16 text-white transition-colors duration-300",
              invoice.sent &&
                "bg-accent-soft text-accent-text disabled:bg-accent-soft disabled:text-accent-text disabled:opacity-100",
            )}
          >
            <Icon name={invoice.sent ? "check_circle" : "send"} filled size={20} />
            <span className="truncate">
              {invoice.sent ? `Sent to ${invoice.billedTo}` : "Send invoice"}
            </span>
          </Button>
        </div>
        <div className="hidden desktop:block">
          <InvoiceDetails invoice={invoice} status={status} />
        </div>
      </aside>
    </div>
  )
}
