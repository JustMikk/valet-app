"use client"

import { useState } from "react"

import { Icon, PersonAvatar } from "@/components/shared"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatMoney } from "@/lib/money/format"
import type { PayrollRow } from "@/lib/data/admin/ops-schemas"
import { cn } from "@/lib/utils"

import { useSendPayrollTo } from "../data/queries"
import { printPayStub } from "./print-pay-stub"

export function PayStubModal({
  row,
  period,
  open,
  onClose,
}: {
  row: PayrollRow
  period: string
  open: boolean
  onClose: () => void
}) {
  const send = useSendPayrollTo()
  const [sent, setSent] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
          setSent(false)
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <PersonAvatar name={row.name} />
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-17 font-bold">{row.name}</DialogTitle>
              <span className="text-13 text-fg-3">{row.email}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Per-event breakdown */}
        <div className="flex flex-col overflow-hidden rounded-card bg-surface-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line px-3 py-2 text-13 font-medium text-fg-3">
            <span>Event</span>
            <span>Date</span>
            <span className="text-right">Hours</span>
            <span className="text-right">Amount</span>
          </div>
          {row.lines.length === 0 && (
            <p className="px-3 py-4 text-14 text-fg-2">No approved shifts this period.</p>
          )}
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
          {row.lines.length > 0 && (
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-line bg-surface px-3 py-2 text-14 font-semibold">
              <span>Total</span>
              <span />
              <span className="text-right font-mono">{row.hours}h</span>
              <span className="text-right font-mono">{formatMoney(row.amountCents)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => printPayStub(row, period)}
            className="flex items-center gap-2 rounded-pill border border-line bg-surface px-3.5 py-2 text-14 font-semibold"
          >
            <Icon name="download" size={16} className="text-fg-2" />
            Download PDF
          </button>

          {sent ? (
            <span className="text-good flex items-center gap-1.5 text-14 font-semibold">
              <Icon name="check_circle" size={18} className="text-good" filled />
              Sent to {row.name.split(" ")[0]}
            </span>
          ) : (
            <button
              type="button"
              disabled={send.isPending}
              onClick={() => send.mutate(row.staffId, { onSuccess: () => setSent(true) })}
              className={cn(
                "flex items-center gap-2 rounded-pill bg-accent-text px-3.5 py-2 text-14 font-semibold text-white transition-opacity",
                send.isPending && "opacity-50",
              )}
            >
              <Icon name="send" size={16} />
              {send.isPending ? "Sending…" : "Send pay stub"}
            </button>
          )}
        </div>

        <DialogClose
          className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-full text-fg-3 hover:bg-surface-2"
          aria-label="Close"
        >
          <Icon name="close" size={20} />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export function PayrollStaffRow({ row, period }: { row: PayrollRow; period: string }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex min-h-15 w-full items-center gap-3 border-b border-line px-0 text-left"
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
        <Icon name="chevron_right" size={20} className="shrink-0 text-fg-3" />
      </button>
      <PayStubModal
        row={row}
        period={period}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
