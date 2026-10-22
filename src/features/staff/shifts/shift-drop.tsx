"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon, PageContainer } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { DROP_REASONS, HARBOR_DETAIL as D } from "@/mocks/staff"

/** Drop-a-shift form: late-drop warning, required reason, optional note. */
export function ShiftDrop() {
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)

  return (
    <PageContainer className="max-w-130 gap-5.5 tablet:mt-6">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-34 leading-x108 font-bold tracking-n030">
          Can&apos;t make {D.dropVenue}?
        </h1>
        <p className="m-0 text-16 leading-x145 text-fg-2">
          {D.dropWhen}. Your spot reopens right away so someone else can take it.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-r18 bg-warn-soft px-4 py-3.5 text-15 leading-x140 font-semibold text-warn">
        <Icon name="schedule" filled size={22} />
        This is less than 24 hours before start, so dispatch will be alerted that it&apos;s a late
        drop.
      </div>

      <div className="flex flex-col gap-2.5">
        <span id="drop-reason" className="text-15 font-medium">
          Reason
        </span>
        <div role="group" aria-labelledby="drop-reason" className="flex flex-col gap-2">
          {DROP_REASONS.map((r) => {
            const on = reason === r.key
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={on}
                onClick={() => setReason(r.key)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-r16 border-0 px-4 text-left text-17 transition-colors duration-200",
                  on
                    ? "bg-accent-soft font-semibold text-accent-text shadow-[inset_0_0_0_1.5px_var(--accent)]"
                    : "bg-surface font-medium text-fg",
                )}
              >
                <Icon name={r.icon} filled size={22} />
                {r.label}
              </button>
            )
          })}
        </div>
        <Textarea
          rows={2}
          aria-label="Note for dispatch"
          placeholder="Add a note for dispatch (optional)"
          className="field-sizing-fixed min-h-0"
        />
      </div>

      <div className="mt-2 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
          Keep shift
        </Button>
        <Button
          variant="destructive"
          className="flex-1 text-white"
          disabled={!reason}
          onClick={() => router.push("/staff/shifts/result?r=dropped")}
        >
          Drop shift
        </Button>
      </div>
    </PageContainer>
  )
}
