"use client"

import { TextField } from "@/components/shared"
import type { AvailabilityQuery, FillMode } from "@/lib/data"

import { ErrorNotice } from "../data/query-state"
import { useAvailableFor, useStaff } from "../data/queries"
import { FillModePicker } from "./fill-mode-picker"
import { HeadcountStepper } from "./headcount-stepper"
import { StaffPicker } from "./staff-picker"

export type Crew = { need: number; instructions: string; fill: FillMode; assignIds: string[] }

type EventCrewStepProps = {
  value: Crew
  onChange: (next: Crew) => void
  /** The venue and time chosen so far: who is free for them is listed when assigning now. */
  window: AvailabilityQuery | null
}

/** Last step: how many people, what to tell them, and how the spots get filled. */
export function EventCrewStep({ value, onChange, window }: EventCrewStepProps) {
  const assigning = value.fill === "assign"
  const available = useAvailableFor(assigning ? window : null)
  // Fallback: all active+onboarded staff when the availability window isn't ready.
  const staffList = useStaff()
  const open = value.need - value.assignIds.length

  // Build the fallback list from the full staff directory (active, onboarded only).
  const fallbackPeople = (staffList.data?.rows ?? [])
    .filter((r) => r.bucket === "active" || r.bucket === "alerts")
    .map((r) => ({ id: r.id, initials: r.initials, name: r.name, note: "Active staff" }))

  const people = available.data ?? (window === null ? fallbackPeople : null)

  return (
    <div className="flex flex-col gap-5">
      <HeadcountStepper
        value={value.need}
        // Fewer spots than people picked: drop the last picks so the numbers always agree.
        onChange={(need) => onChange({ ...value, need, assignIds: value.assignIds.slice(0, need) })}
      />
      <TextField
        label="Instructions"
        multiline
        rows={3}
        maxLength={1000}
        value={value.instructions}
        onChange={(e) => onChange({ ...value, instructions: e.target.value })}
        placeholder="Dress code, who to report to, where staff park"
      />
      <FillModePicker value={value.fill} onChange={(fill) => onChange({ ...value, fill })} />
      {assigning && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-15 font-medium">{available.data ? "Who’s free" : "Staff"}</span>
            <span role="status" className="text-13 text-fg-2">
              {value.assignIds.length} of {value.need} chosen
              {open > 0 && value.assignIds.length > 0 ? ` · ${open} post as open shifts` : ""}
            </span>
          </div>
          {available.isPending && window !== null && (
            <p className="m-0 text-14 text-fg-2">Finding who&rsquo;s free…</p>
          )}
          {available.error && <ErrorNotice message={available.error.message} />}
          {people && (
            <StaffPicker
              people={people}
              selected={value.assignIds}
              onChange={(assignIds) => onChange({ ...value, assignIds })}
              max={value.need}
            />
          )}
        </div>
      )}
    </div>
  )
}
