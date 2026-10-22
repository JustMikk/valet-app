import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

const TONE = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
} as const

type AttentionAction = { label: string; onClick: () => void }

type AttentionCardProps = {
  tone: keyof typeof TONE
  icon: IconName
  /** What needs attention, in words. */
  title: string
  /** Where, since when, how long unresolved. */
  meta: string
  /** Up to three in-place actions; the first is the strong one. */
  actions: [AttentionAction, AttentionAction?, AttentionAction?]
  className?: string
}

/** "What · how long · resolve in place" card (Design System "attention-card"). */
export function AttentionCard({ tone, icon, title, meta, actions, className }: AttentionCardProps) {
  return (
    <div className={cn("flex flex-col gap-3.5 rounded-card bg-surface p-4.5", className)}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-pill", TONE[tone])}>
          <Icon name={icon} filled size={22} />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-17 leading-x130 font-semibold">{title}</span>
          <span className="text-14 leading-x135 text-fg-2">{meta}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {actions
          .filter((action): action is AttentionAction => Boolean(action))
          .map((action, i) => (
            <Button
              key={action.label}
              variant={i === 0 ? "strong" : "elevated"}
              size="compact"
              className="flex-1"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
      </div>
    </div>
  )
}
