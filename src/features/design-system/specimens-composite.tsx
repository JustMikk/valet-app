"use client"

import { useState } from "react"

import {
  AttentionCard,
  ConfirmSheet,
  FeatureCard,
  PagerDots,
  PersonAvatar,
  PersonRow,
  SHEET_DESCRIPTION,
  SHEET_TITLE,
  StatusBadge,
  SystemBanner,
  TabBar,
  TextField,
} from "@/components/shared"
import { Button } from "@/components/ui/button"
import { STATUS } from "@/lib/status/presets"

import { Specimen } from "./specimens-core"

const noop = () => {}

const TABS = [
  { key: "board", label: "Board", icon: "space_dashboard", onSelect: noop },
  { key: "events", label: "Events", icon: "event", onSelect: noop },
  { key: "inbox", label: "Inbox", icon: "inbox", badge: 2, onSelect: noop },
  { key: "staff", label: "Staff", icon: "group", onSelect: noop },
] as const

const NO_SHOW = {
  title: "Mark Marcus Reed as no-show?",
  consequence:
    "He'll get 0 hours for Osteria Nove. This counts toward his reliability and is logged under your name.",
}

/** Specimens from person row to sheet, in the sheet's order. */
export function CompositeSpecimens() {
  const [tab, setTab] = useState("board")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [note, setNote] = useState("Garage level 3, no signal")

  return (
    <>
      <Specimen label="person-row · avatar / evidence / state">
        <div className="flex flex-col border-t border-line">
          <PersonRow
            avatar={<PersonAvatar name="Ana Kovač" />}
            name="Ana Kovač"
            detail="In 5:52 PM · 38 m from center · ±12 m"
            trailing={<StatusBadge status={STATUS.onSite}>2h 12m</StatusBadge>}
          />
          <PersonRow
            avatar={<PersonAvatar open />}
            name="Open slot"
            detail="Started 1h 04m ago"
            trailing={
              <Button variant="strong" size="xs">
                Assign
              </Button>
            }
          />
        </div>
      </Specimen>

      <Specimen label="attention-card · what · how long · resolve in place">
        <AttentionCard
          tone="warn"
          icon="running_with_errors"
          title="Marcus Reed is 12 min late"
          meta="Osteria Nove · started 5:30 PM · unresolved 2 min"
          actions={[
            { label: "Message", onClick: noop },
            { label: "Call", onClick: noop },
            { label: "Replace", onClick: noop },
          ]}
        />
      </Specimen>

      <Specimen label="feature-card · dark, one per screen, dismissible">
        <FeatureCard
          title="3 open shifts this weekend"
          body="Westfield Gala and The Laurel Club still need attendants. First to claim gets it."
          cta="See open shifts"
          onClick={noop}
          onDismiss={noop}
        />
        <PagerDots count={3} active={0} label="Promotion" />
      </Specimen>

      <Specimen label="field · label / input / helper">
        <TextField
          label="Note for your manager"
          description="Optional · your manager sees this with your selfie"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Specimen>

      <Specimen label="system-banner · offline / sync / stale">
        <div className="flex flex-col gap-2">
          <SystemBanner tone="warn" icon="cloud_off">
            Offline · board last updated 6:02 PM
          </SystemBanner>
          <SystemBanner icon="sync">Clock-in saved · will sync when you have signal</SystemBanner>
        </div>
      </Specimen>

      <Specimen label="tab-bar · floating, active = filled pill">
        <TabBar
          label="Example navigation"
          current={tab}
          items={TABS.map((t) => ({ ...t, onSelect: setTab }))}
        />
      </Specimen>

      <Specimen label="sheet · confirm consequence in words">
        {/* Static preview of the sheet surface; its action opens the real, modal ConfirmSheet. */}
        <div className="flex flex-col gap-4 rounded-r28 bg-elev px-5 pt-3 pb-5 shadow-sheet">
          <span aria-hidden="true" className="h-1.25 w-10 self-center rounded-r9 bg-line" />
          <span className={SHEET_TITLE}>{NO_SHOW.title}</span>
          <span className={SHEET_DESCRIPTION}>{NO_SHOW.consequence}</span>
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => setSheetOpen(true)}>
              Mark no-show
            </Button>
          </div>
        </div>
        <ConfirmSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={NO_SHOW.title}
          consequence={NO_SHOW.consequence}
          confirmLabel="Mark no-show"
          tone="destructive"
          onConfirm={() => setSheetOpen(false)}
        />
      </Specimen>
    </>
  )
}
