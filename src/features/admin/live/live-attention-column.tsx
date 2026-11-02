"use client"

import { useState } from "react"

import { AttentionCard, PillTabs } from "@/components/shared"
import type { AttentionItem } from "@/lib/live/model"
import { cn } from "@/lib/utils"

import { BODY, CARD, COLUMN, ColumnHead, countOf, TITLE } from "./live-columns"
import { attentionActions } from "./live-parts"
import type { LiveBoard } from "./use-live-board"

type AttentionFilter = "all" | "open" | "late" | "approvals"
const ATTENTION_GROUP: Record<AttentionItem["kind"], Exclude<AttentionFilter, "all">> = {
  short: "open",
  unfilled: "open",
  late: "late",
  waiting: "approvals",
}

export function AttentionColumn({ board }: { board: LiveBoard }) {
  const [filter, setFilter] = useState<AttentionFilter>("all")
  const all = board.attention
  const inGroup = (group: AttentionFilter) => (item: AttentionItem) =>
    group === "all" || ATTENTION_GROUP[item.kind] === group
  const shown = all.filter(inGroup(filter))
  return (
    <section aria-label="Attention" className={cn(COLUMN, CARD)}>
      <ColumnHead
        title={<h2 className={TITLE}>Attention · {board.pulse.need}</h2>}
        tabs={
          <PillTabs
            label="Show attention"
            size="sm"
            value={filter}
            onValueChange={setFilter}
            items={[
              { value: "all", label: "All" },
              { value: "open", label: "Open", count: countOf(all, inGroup("open")) },
              { value: "late", label: "Late", count: countOf(all, inGroup("late")) },
              { value: "approvals", label: "Approvals", count: countOf(all, inGroup("approvals")) },
            ]}
          />
        }
      />
      <div className={cn(BODY, "gap-1 px-5 pt-2 pb-4")}>
        {shown.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex-none border-b border-line pb-1 last:border-b-0",
              board.leaving[item.key] ? "animate-out" : "animate-fade",
            )}
          >
            <AttentionCard
              density="compact"
              variant="plain"
              primary="bad"
              tone={item.tone}
              icon={item.icon}
              title={item.title}
              meta={item.sub}
              selfie={item.selfie}
              selfieUrl={item.selfieUrl}
              actions={attentionActions(item, board.run)}
            />
          </div>
        ))}
        {shown.length === 0 && (
          <p className="m-0 py-2 text-15 text-fg-2">
            {all.length === 0
              ? "All clear. Nothing needs you right now."
              : "Nothing of this kind right now."}
          </p>
        )}
      </div>
    </section>
  )
}
