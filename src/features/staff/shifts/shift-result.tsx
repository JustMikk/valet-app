"use client"

import { useRouter } from "next/navigation"

import { Icon, PageContainer } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SHIFT_RESULTS, type ShiftResultKey } from "@/mocks/staff"

import { useDemoParam } from "../session/use-demo-param"

const KEYS = Object.keys(SHIFT_RESULTS) as ShiftResultKey[]
const TONE = { ok: "bg-ok", fg: "bg-fg", warn: "bg-warn" } as const

/** Outcome of a claim or a drop: claimed, just filled, overlap, dropped. */
export function ShiftResult() {
  const router = useRouter()
  const result = SHIFT_RESULTS[useDemoParam("r", KEYS) ?? "claimed"]

  return (
    <PageContainer className="max-w-130 gap-5.5 tablet:mt-6">
      <div
        className={cn(
          "grid size-22 animate-pop place-items-center rounded-pill text-bg",
          TONE[result.tone],
        )}
      >
        <Icon name={result.icon} weight={700} size={46} />
      </div>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-display text-38 leading-x105 font-bold tracking-n035">
          {result.title}
        </h1>
        <p className="m-0 text-17 leading-x145 text-fg-2">{result.body}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Button variant="strong" onClick={() => router.push(result.primaryHref)}>
          {result.primaryLabel}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/staff/open")}>
          Back to open shifts
        </Button>
      </div>
    </PageContainer>
  )
}
