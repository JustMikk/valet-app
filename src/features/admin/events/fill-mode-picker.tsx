"use client"

import { Icon } from "@/components/shared"
import type { FillMode } from "@/lib/data"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

const FILL_MODES = [
  { key: "open", label: "Post as open shifts", note: "First to claim gets it", icon: "bolt" },
  {
    key: "assign",
    label: "Assign people now",
    note: "Pick names; the rest post as open",
    icon: "how_to_reg",
  },
] as const satisfies readonly { key: FillMode; label: string; note: string; icon: IconName }[]

type FillModePickerProps = { value: FillMode; onChange: (next: FillMode) => void }

/** "How to fill": post open shifts, or assign people now. */
export function FillModePicker({ value, onChange }: FillModePickerProps) {
  return (
    <div role="radiogroup" aria-label="How to fill" className="flex flex-col gap-2">
      <span className="text-15 font-medium">How to fill</span>
      {FILL_MODES.map((mode) => {
        const on = value === mode.key
        return (
          <button
            key={mode.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(mode.key)}
            className={cn(
              "flex min-h-16 items-center gap-3 rounded-field border-0 px-4 text-left text-fg transition-[background-color,box-shadow] duration-200",
              on
                ? "bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--accent)]"
                : "bg-surface shadow-none",
            )}
          >
            <Icon name={mode.icon} filled size={22} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-16 font-semibold">{mode.label}</span>
              <span className="text-13 text-fg-2">{mode.note}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
