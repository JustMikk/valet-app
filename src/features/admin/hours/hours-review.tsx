"use client"

import { useState, type ReactNode } from "react"

import { GlassCard, Icon, PersonAvatar, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { Hours, HoursEntry } from "@/lib/data"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, CARD_GRID } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useHours, useHoursActions } from "../data/queries"
import { AdjustSheet } from "./adjust-sheet"

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
  busy: boolean
  onApprove?: () => void
  onAdjust?: () => void
}

/** A card with Adjust / Approve while it needs review; a confirmation line once approved. */
function EntryCard({ entry, index, busy, onApprove, onAdjust }: EntryCardProps) {
  const done = entry.approved
  const first = entry.name.split(" ")[0]
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
        <span className="font-display text-22 font-bold tabular-nums">{entry.total}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TimeCell label="IN" value={entry.inTime} />
        <TimeCell label="OUT" value={entry.outTime} flagged={entry.outFlagged && !done} />
      </div>
      {!done && (
        <span className="flex items-start gap-2 text-14 leading-x140 font-medium text-warn">
          <Icon name="flag" filled size={18} />
          {entry.flag}
        </span>
      )}
      {!done ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-12 flex-1 text-15"
            disabled={busy}
            onClick={onAdjust}
          >
            Adjust
          </Button>
          <Button
            variant="strong"
            size="sm"
            className="h-12 flex-1 text-15"
            disabled={busy}
            onClick={onApprove}
          >
            Approve
          </Button>
        </div>
      ) : (
        <span className="flex animate-rise items-center gap-1.5 text-14 font-semibold text-ok">
          <Icon name="check_circle" filled size={18} />
          {entry.adjustedReason ? `Adjusted & approved · ${first} notified` : "Approved"}
        </span>
      )}
    </GlassCard>
  )
}

function Body({ hours, tab, tabs }: { hours: Hours; tab: HoursTab; tabs: ReactNode }) {
  const [adjusting, setAdjusting] = useState<HoursEntry | null>(null)
  const { approve, approveClean } = useHoursActions()

  const entries = tab === "review" ? hours.review : hours.approved
  const error = approve.error ?? approveClean.error

  return (
    <>
      {tabs}
      <div className="flex flex-col gap-4">
        {tab === "review" && hours.cleanCount > 0 && (
          <GlassCard className="flex flex-wrap items-center gap-3 px-4.5 py-4">
            <Icon name="task_alt" filled size={26} className="text-ok" />
            <span className="min-w-50 flex-1 text-16 leading-x140 font-medium">
              {hours.cleanCount} {hours.cleanCount === 1 ? "entry has" : "entries have"} no flags:
              on time, inside the geofence, with a selfie.
            </span>
            <Button
              variant="strong"
              size="compact"
              disabled={approveClean.isPending}
              className="px-4.5"
              onClick={() => approveClean.mutate()}
            >
              Approve {hours.cleanCount}
            </Button>
          </GlassCard>
        )}
        {approveClean.isSuccess && (
          <p role="status" className="m-0 text-14 font-semibold text-ok">
            {approveClean.data} entries approved. Staff can see them now.
          </p>
        )}
        {error && <ErrorNotice message={error.message} />}
        <div className={CARD_GRID}>
          {entries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              busy={approve.isPending}
              onApprove={() => approve.mutate(entry.id)}
              onAdjust={() => setAdjusting(entry)}
            />
          ))}
        </div>
        {entries.length === 0 && (
          <p className="m-0 py-8 text-center text-15 text-fg-2">
            {tab === "review" ? "Nothing needs review." : "Nothing approved yet."}
          </p>
        )}
      </div>
      <AdjustSheet entry={adjusting} onClose={() => setAdjusting(null)} />
    </>
  )
}

/** Hours review: approve the clean batch in one tap; flagged entries approve or adjust in place. */
export function HoursReview() {
  const hours = useHours()
  const [tab, setTab] = useState<HoursTab>("review")
  const pending = hours.data?.review.length ?? 0
  const tabs = [
    { value: "review" as const, label: "Needs review", count: pending || undefined },
    { value: "approved" as const, label: "Approved" },
  ]
  const tabsFor = (className?: string) => (
    <PillTabs label="Show" items={tabs} value={tab} onValueChange={setTab} className={className} />
  )
  return (
    <AdminPage>
      <AdminHead title="Hours" sub={hours.data?.period ?? "…"} tools={tabsFor()} />
      <QueryState query={hours} rows={3}>
        {/* Phone: the filters sit under the heading; from tablet they live in the top bar. */}
        {(data) => <Body hours={data} tab={tab} tabs={tabsFor("tablet:hidden")} />}
      </QueryState>
    </AdminPage>
  )
}
