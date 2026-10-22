"use client"

import { useState } from "react"
import Image from "next/image"

import { GlassCard, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { INVOICE_DETAIL as INVOICE } from "@/mocks/admin"

import { AdminPage, FORM } from "../common/admin-page"

/** One invoice: lines from approved hours, total, PDF and send. */
export function InvoiceDetail() {
  const [sent, setSent] = useState(false)

  return (
    <AdminPage>
      <div className={FORM}>
        <GlassCard className="flex flex-col gap-4.5 rounded-r28 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-13 font-semibold text-fg-3">{INVOICE.number}</span>
              <h1 className="m-0 font-display text-30 leading-x110 font-bold tracking-n030">
                {INVOICE.venue}
              </h1>
              <span className="text-15 text-fg-2">{INVOICE.period}</span>
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
            {INVOICE.lines.map((line) => (
              <li
                key={line.what}
                className="box-content flex min-h-15 items-center gap-3 border-b border-line"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-15 font-semibold">{line.what}</span>
                  <span className="text-13 text-fg-2">{line.calc}</span>
                </div>
                <span className="font-mono text-15 font-semibold">{line.amount}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between">
            <span className="text-16 font-medium">Total due</span>
            <span className="font-display text-40 leading-x100 font-bold tracking-n035">
              {INVOICE.total}
            </span>
          </div>
          <span className="flex items-start gap-2 text-14 leading-x140 font-medium text-warn">
            <Icon name="info" filled size={18} />
            {INVOICE.notice}
          </span>
        </GlassCard>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1 gap-1.5 text-16">
            <Icon name="download" size={22} />
            PDF
          </Button>
          <Button
            variant="accent"
            disabled={sent}
            onClick={() => setSent(true)}
            className={cn(
              "flex-2 text-17 transition-colors duration-300",
              sent && "bg-ok text-white disabled:bg-ok disabled:text-white",
            )}
          >
            {sent ? `Sent to ${INVOICE.sentTo}` : "Send invoice"}
          </Button>
        </div>
      </div>
    </AdminPage>
  )
}
