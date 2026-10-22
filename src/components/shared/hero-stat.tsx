import { cva } from "class-variance-authority"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

const valueVariants = cva("font-display leading-x100 font-bold tracking-n045 tabular-nums", {
  variants: {
    size: { 60: "text-60", 56: "text-56", 52: "text-52" },
  },
  defaultVariants: { size: 56 },
})

const toneText = { ok: "text-ok", warn: "text-warn", bad: "text-bad", fg: "text-fg" } as const

type HeroStatProps = {
  /** The one big number of the screen: a time, a duration, a count. */
  value: string
  size?: 60 | 56 | 52
  /** Optional line under the number: tone word with glyph, then muted context. */
  delta?: { tone: keyof typeof toneText; icon: IconName; label: string; context?: string }
  className?: string
}

/** Display number plus delta line ("One big number" principle). */
export function HeroStat({ value, size, delta, className }: HeroStatProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className={valueVariants({ size })}>{value}</span>
      {delta && (
        <div className="flex items-center gap-1.5 text-17 leading-x100 font-semibold">
          <Icon name={delta.icon} weight={700} size={20} className={toneText[delta.tone]} />
          <span className={toneText[delta.tone]}>{delta.label}</span>
          {delta.context && <span className="font-normal text-fg-2">{delta.context}</span>}
        </div>
      )}
    </div>
  )
}
