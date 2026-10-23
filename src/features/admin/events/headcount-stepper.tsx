"use client"

import { Icon } from "@/components/shared"

const MIN_STAFF = 1
const MAX_STAFF = 40
const STEP =
  "grid size-11 place-items-center rounded-pill border-0 bg-surface text-fg transition-transform duration-160 active:scale-90 disabled:text-fg-3"

type HeadcountStepperProps = { value: number; onChange: (next: number) => void }

/** "Staff needed" with minus / plus (1 to 40). */
export function HeadcountStepper({ value, onChange }: HeadcountStepperProps) {
  return (
    <div className="box-content flex min-h-16 items-center justify-between border-y border-line">
      <div className="flex flex-col gap-0.5">
        <span className="text-17 font-medium">Staff needed</span>
        <span className="text-13 text-fg-2">Unassigned spots post as open shifts</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Fewer staff"
          disabled={value <= MIN_STAFF}
          onClick={() => onChange(Math.max(MIN_STAFF, value - 1))}
          className={STEP}
        >
          <Icon name="remove" size={22} />
        </button>
        <output
          aria-live="polite"
          className="w-11 text-center font-display text-26 font-bold tabular-nums"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label="More staff"
          disabled={value >= MAX_STAFF}
          onClick={() => onChange(Math.min(MAX_STAFF, value + 1))}
          className={STEP}
        >
          <Icon name="add" size={22} />
        </button>
      </div>
    </div>
  )
}
