"use client"

import Link from "next/link"

import { GlassCard, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { EventPay } from "@/lib/data"
import { formatHoursDecimal, formatMoney } from "@/lib/money/format"

import { SectionTitle } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useEventPay, useEventPayActions, useSession } from "../data/queries"
import { payCsv, payFileName, payPdf, saveFile } from "./pay-export"
import { PayRateEditor } from "./pay-rate-editor"
import { PayTable } from "./pay-table"

/** The event's valet pay sheet (ADR-022): who worked, what they're owed, paid and tips. */
export function PaySheet({ eventId }: { eventId: string }) {
  const pay = useEventPay(eventId)
  return (
    <QueryState query={pay} rows={4}>
      {(data) => <PayBody sheet={data} />}
    </QueryState>
  )
}

function PayBody({ sheet }: { sheet: EventPay }) {
  const { setRate, mark, markAll } = useEventPayActions(sheet.eventId)
  const company = useSession().data?.admin.company ?? "Pay sheet"
  const busy = setRate.isPending || mark.isPending || markAll.isPending
  const error = setRate.error ?? mark.error ?? markAll.error
  const pending = sheet.rows.some((row) => row.state === "pending")
  const inReview = sheet.rows.some((row) => row.state === "in_review")
  const totals: [string, string][] = [
    ["Valets", String(sheet.totals.valets)],
    ["Total hours", formatHoursDecimal(sheet.totals.minutes)],
    ["Total pay", formatMoney(sheet.totals.amountCents)],
    ["Paid", formatMoney(sheet.totals.paidCents)],
    ["Pending", formatMoney(sheet.totals.pendingCents)],
  ]

  return (
    <div className="flex flex-col gap-5">
      <GlassCard className="flex flex-col gap-4 rounded-r24 p-5">
        <div className="flex flex-col gap-1">
          <SectionTitle>Valet pay</SectionTitle>
          <span className="text-15 text-fg-2">
            {sheet.venue} · {sheet.name} · {sheet.date} · {sheet.start} – {sheet.end}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-15 font-medium">Per hour</span>
          <PayRateEditor
            rateCents={sheet.rateCents}
            saving={setRate.isPending}
            onSave={(rateCents) => setRate.mutate(rateCents)}
          />
        </div>
      </GlassCard>

      {error && <ErrorNotice message={error.message} />}

      <PayTable
        rows={sheet.rows}
        busy={busy}
        onPaid={(row, paid) => mark.mutate({ assignmentId: row.assignmentId, patch: { paid } })}
        onTips={(row, tips) => mark.mutate({ assignmentId: row.assignmentId, patch: { tips } })}
      />
      {inReview && (
        <p className="m-0 flex items-center gap-2 text-14 text-fg-2">
          <Icon name="info" filled size={18} />
          Hours in review can be marked paid once approved on the{" "}
          <Link href="/admin/hours" className="font-semibold text-fg">
            Hours
          </Link>{" "}
          screen.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-5">
        {totals.map(([label, value]) => (
          <GlassCard key={label} className="flex flex-col gap-1 rounded-r20 px-4 py-3.5">
            <span className="font-display text-22 leading-x100 font-bold tabular-nums">
              {value}
            </span>
            <span className="text-13 font-medium text-fg-2">{label}</span>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="strong"
          className="gap-2 text-16"
          disabled={!pending || busy}
          onClick={() => markAll.mutate()}
        >
          <Icon name="task_alt" size={20} />
          Mark all paid
        </Button>
        <Button
          variant="secondary"
          className="gap-2 text-16"
          onClick={() => saveFile(payCsv(sheet), payFileName(sheet, "csv"), "text/csv")}
        >
          <Icon name="description" size={20} />
          Excel (CSV)
        </Button>
        <Button
          variant="secondary"
          className="gap-2 text-16"
          onClick={() =>
            saveFile(payPdf(sheet, company), payFileName(sheet, "pdf"), "application/pdf")
          }
        >
          <Icon name="download" size={20} />
          PDF
        </Button>
      </div>
    </div>
  )
}
