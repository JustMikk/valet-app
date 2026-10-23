"use client"

import { TextField } from "@/components/shared"
import type { FillMode } from "@/lib/data"

import { FillModePicker } from "./fill-mode-picker"
import { HeadcountStepper } from "./headcount-stepper"

export type Crew = { need: number; instructions: string; fill: FillMode }

type EventCrewStepProps = { value: Crew; onChange: (next: Crew) => void }

/** Last step: how many people, what to tell them, and how the spots get filled. */
export function EventCrewStep({ value, onChange }: EventCrewStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <HeadcountStepper value={value.need} onChange={(need) => onChange({ ...value, need })} />
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
    </div>
  )
}
