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
  /** `glass` is the Live Board phone card; `solid` the Design System sheet and desktop column. */
  variant?: "solid" | "glass"
  /** `compact` is the desktop attention column: smaller type and 38 px buttons. */
  density?: "default" | "compact"
  /** Shows the clock-in selfie thumbnail (approval requests). */
  selfie?: boolean
  /** Actual selfie data URL — renders as a photo; falls back to the face icon when absent. */
  selfieUrl?: string | null
  className?: string
}

/** "What · how long · resolve in place" card (Design System "attention-card"). */
export function AttentionCard({
  tone,
  icon,
  title,
  meta,
  actions,
  variant = "solid",
  density = "default",
  selfie = false,
  selfieUrl,
  className,
}: AttentionCardProps) {
  const compact = density === "compact"
  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "glass" ? "rounded-card glass-card" : "bg-surface",
        compact ? "gap-3 rounded-r20 p-4" : "gap-3.5 p-4.5",
        variant === "solid" && !compact && "rounded-card",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-pill", TONE[tone])}>
          <Icon name={icon} filled size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={cn(
              "font-semibold",
              compact ? "text-15 leading-x130" : "text-17 leading-x130",
            )}
          >
            {title}
          </span>
          <span
            className={cn("text-fg-2", compact ? "text-13 leading-x140" : "text-14 leading-x135")}
          >
            {meta}
          </span>
        </div>
        {selfie && (
          <span
            role="img"
            aria-label="Clock-in selfie"
            style={selfieUrl ? { backgroundImage: `url(${selfieUrl})` } : undefined}
            className={cn(
              "flex-none overflow-hidden bg-cover bg-center",
              compact ? "h-14 w-11 rounded-r10" : "h-15 w-12 rounded-r12",
              !selfieUrl && "grid place-items-center text-white/60 selfie-thumb",
            )}
          >
            {!selfieUrl && <Icon name="face" filled size={compact ? 20 : 22} />}
          </span>
        )}
      </div>
      <div className={cn("flex", compact ? "gap-1.5" : "gap-2")}>
        {actions
          .filter((action): action is AttentionAction => Boolean(action))
          .map((action, i) => (
            <Button
              key={action.label}
              variant={i === 0 ? "strong" : "elevated"}
              size="compact"
              className={cn("flex-1", compact && "h-9.5 text-14")}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
      </div>
    </div>
  )
}
