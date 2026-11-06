"use client"

import { useState } from "react"
import Link from "next/link"

import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { EventPay } from "@/lib/data"
import { cn } from "@/lib/utils"

import { ErrorNotice, QueryState } from "../data/query-state"
import { useEventPay, useEventPayActions } from "../data/pay-queries"
import { useSession } from "../data/queries"
import { payCsv, payFileName, payPdf, saveFile } from "./pay-export"
import { PayFacts, PayTotals } from "./pay-parts"
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

const ACTION = "gap-2 text-16"

function PayBody({ sheet }: { sheet: EventPay }) {
  const { setRate, mark, markAll, send } = useEventPayActions(sheet.eventId)
  const company = useSession().data?.admin.company ?? "Pay sheet"
  const [sentTo, setSentTo] = useState<string | null>(null)
  const busy = setRate.isPending || mark.isPending || markAll.isPending || send.isPending
  const error = setRate.error ?? mark.error ?? markAll.error ?? send.error
  const pending = sheet.rows.some((row) => row.state === "pending")
  const inReview = sheet.rows.some((row) => row.state === "in_review")
  const sendable = sheet.rows.some((row) => row.state !== "on_shift")

  const sendStub = (staffId: string | undefined, who: string) =>
    send.mutate(staffId, {
      onSuccess: ({ sent }) =>
        setSentTo(staffId ? who : `${sent} ${sent === 1 ? "valet" : "valets"}`),
    })

  return (
    <div className="flex flex-col gap-5">
      <PayFacts
        sheet={sheet}
        rate={
          <PayRateEditor
            rateCents={sheet.rateCents}
            saving={setRate.isPending}
            onSave={(rateCents) => setRate.mutate(rateCents)}
          />
        }
      />

      {error && <ErrorNotice message={error.message} />}
      {sentTo && !error && (
        <p className="m-0 flex items-center gap-2 text-15 font-semibold text-ok">
          <Icon name="check_circle" filled size={20} />
          Pay stub sent to {sentTo}. They&apos;ll see it in their notifications and inbox.
        </p>
      )}

      <PayTable
        rows={sheet.rows}
        rateCents={sheet.rateCents}
        busy={busy}
        onPaid={(row, paid) => mark.mutate({ assignmentId: row.assignmentId, patch: { paid } })}
        onTips={(row, tips) => mark.mutate({ assignmentId: row.assignmentId, patch: { tips } })}
        onSend={(row) => sendStub(row.staffId, row.name)}
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

      <div className="grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_18rem]">
        <PayTotals sheet={sheet} />
        <div className="flex flex-col gap-2.5">
          <Button
            variant="strong"
            className={cn(ACTION, "bg-accent-text text-white")}
            disabled={!sendable || busy}
            onClick={() => sendStub(undefined, "")}
          >
            <Icon name="send" filled size={20} />
            {send.isPending ? "Sending…" : "Send to all valets"}
          </Button>
          <Button
            variant="strong"
            className={ACTION}
            disabled={!pending || busy}
            onClick={() => markAll.mutate()}
          >
            <Icon name="task_alt" size={20} />
            Mark all paid
          </Button>
          <Button
            variant="secondary"
            className={ACTION}
            onClick={() => saveFile(payCsv(sheet), payFileName(sheet, "csv"), "text/csv")}
          >
            <Icon name="description" size={20} />
            Excel (CSV)
          </Button>
          <Button
            variant="secondary"
            className={ACTION}
            onClick={() =>
              saveFile(payPdf(sheet, company), payFileName(sheet, "pdf"), "application/pdf")
            }
          >
            <Icon name="download" size={20} />
            PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
