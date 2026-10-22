"use client"

import { useState } from "react"

import { GlassCard, Icon, PersonAvatar, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CLEAN_ENTRIES, HOURS_ENTRIES, ADJUSTED, type HoursEntry } from "@/mocks/admin"

import { AdminHead, AdminPage, CARD_GRID } from "../common/admin-page"
import { AdjustSheet } from "./adjust-sheet"

type Resolution = "ok" | "adjusted"
type HoursTab = "review" | "approved"

function TimeCell({ label, value, flagged }: { label: string; value: string; flagged?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-r14 bg-surface px-3 py-2.5">
      <span className="text-12 font-medium text-fg-2">{label}</span>
      <span className={cn("font-mono text-16 font-semibold", flagged ? "text-warn" : "text-fg")}>
        {value}
      </span>
    </div>
  )
}

type EntryCardProps = {
  entry: HoursEntry
  index: number
  resolution: Resolution | undefined
  onApprove: () => void
  onAdjust: () => void
}

function EntryCard({ entry, index, resolution, onApprove, onAdjust }: EntryCardProps) {
  const done = resolution !== undefined
  const adjusted = resolution === "adjusted"
  return (
    <GlassCard
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        "flex animate-rise flex-col gap-3.5 p-4.5 transition-opacity duration-300",
        done && "opacity-75",
      )}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={entry.name} className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-16 font-semibold">{entry.name}</span>
          <span className="text-14 text-fg-2">{entry.venue}</span>
        </div>
        <span className="font-display text-22 font-bold tabular-nums">
          {adjusted && entry.adjustable ? ADJUSTED.total : entry.total}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TimeCell label="IN" value={entry.inTime} />
        <TimeCell
          label="OUT"
          value={adjusted && entry.adjustable ? ADJUSTED.outTime : entry.outTime}
          flagged={entry.outFlagged && !done}
        />
      </div>
      {!done && (
        <span className="flex items-start gap-2 text-14 leading-x140 font-medium text-warn">
          <Icon name="flag" filled size={18} />
          {entry.flag}
        </span>
      )}
      {!done ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="h-12 flex-1 text-15" onClick={onAdjust}>
            Adjust
          </Button>
          <Button variant="strong" size="sm" className="h-12 flex-1 text-15" onClick={onApprove}>
            Approve
          </Button>
        </div>
      ) : (
        <span className="flex animate-rise items-center gap-1.5 text-14 font-semibold text-ok">
          <Icon name="check_circle" filled size={18} />
          {adjusted ? `Adjusted & approved · ${entry.name.split(" ")[0]} notified` : "Approved"}
        </span>
      )}
    </GlassCard>
  )
}

/** Hours review: approve the clean batch in one tap; flagged entries approve or adjust in place. */
export function HoursReview() {
  const [tab, setTab] = useState<HoursTab>("review")
  const [resolved, setResolved] = useState<Record<string, Resolution>>({})
  const [cleanDone, setCleanDone] = useState(false)
  const [adjusting, setAdjusting] = useState<HoursEntry | null>(null)

  const pending = HOURS_ENTRIES.filter((e) => !resolved[e.id]).length
  const entries = HOURS_ENTRIES.filter((e) => tab === "review" || resolved[e.id])
  const tabs = [
    { value: "review" as const, label: "Needs review", count: pending || undefined },
    { value: "approved" as const, label: "Approved" },
  ]

  return (
    <AdminPage>
      <AdminHead title="Hours" sub="Pay period Oct 19 – 25 · locks Mon 9 AM" />
      <PillTabs label="Show" items={tabs} value={tab} onValueChange={setTab} />
      <div className="flex flex-col gap-4">
        {tab === "review" && (
          <GlassCard className="flex flex-wrap items-center gap-3 px-4.5 py-4">
            <Icon name="task_alt" filled size={26} className="text-ok" />
            <span className="min-w-50 flex-1 text-16 leading-x140 font-medium">
              {cleanDone
                ? `${CLEAN_ENTRIES} entries approved. Staff can see them now.`
                : `${CLEAN_ENTRIES} entries have no flags: on time, inside the geofence, with a selfie.`}
            </span>
            <Button
              variant={cleanDone ? "secondary" : "strong"}
              size="compact"
              disabled={cleanDone}
              className={cn(
                "px-4.5 transition-colors duration-300",
                cleanDone && "bg-ok-soft text-ok disabled:bg-ok-soft disabled:text-ok",
              )}
              onClick={() => setCleanDone(true)}
            >
              {cleanDone ? "Approved" : `Approve ${CLEAN_ENTRIES}`}
            </Button>
          </GlassCard>
        )}
        <div className={CARD_GRID}>
          {entries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              resolution={resolved[entry.id]}
              onApprove={() => setResolved((r) => ({ ...r, [entry.id]: "ok" }))}
              onAdjust={() => setAdjusting(entry)}
            />
          ))}
        </div>
      </div>
      <AdjustSheet
        entry={adjusting}
        onClose={() => setAdjusting(null)}
        onSave={(id) => {
          setResolved((r) => ({ ...r, [id]: "adjusted" }))
          setAdjusting(null)
        }}
      />
    </AdminPage>
  )
}
