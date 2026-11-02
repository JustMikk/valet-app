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

/** With an icon, the action is a round icon-only button (the label becomes its accessible name). */
type AttentionAction = { label: string; onClick: () => void; icon?: IconName }

type AttentionCardProps = {
  tone: keyof typeof TONE
  icon: IconName
  /** What needs attention, in words. */
  title: string
  /** Where, since when, how long unresolved. */
  meta: string
  /**
   * Up to three in-place actions. The first labelled one is the strong button, always on the
   * left; the others are grey pills (icon-only when they carry an icon) to its right.
   */
  actions: [AttentionAction, AttentionAction?, AttentionAction?]
  /**
   * `solid` is a white card like the invoice (Live Board phone, Design System sheet); `glass`
   * the translucent card; `plain` sits flat inside another card (desktop attention column).
   */
  variant?: "solid" | "glass" | "plain"
  /** Fill of the first (strong) action: ink, or brick red for the Live Board attention cards. */
  primary?: "fg" | "bad"
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
  primary = "fg",
  selfie = false,
  selfieUrl,
  className,
}: AttentionCardProps) {
  const compact = density === "compact"
  const present = actions.filter((action): action is AttentionAction => Boolean(action))
  const strong = present.find((action) => !action.icon)
  const rest = present.filter((action) => action !== strong)
  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "glass" && "rounded-card glass-card",
        variant === "solid" && "border border-line bg-elev",
        compact ? "gap-3 rounded-r20 p-4" : "gap-3.5 p-4.5",
        variant === "solid" && !compact && "rounded-card",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-pill", TONE[tone])}>
          <Icon name={icon} filled size={22} />
        </span>
        {/* Block, not flex: the selfie floats top right so the meta wraps under it full width. */}
        <div className="min-w-0 flex-1">
          {selfie && (
            <span
              role="img"
              aria-label="Clock-in selfie"
              style={selfieUrl ? { backgroundImage: `url(${selfieUrl})` } : undefined}
              className={cn(
                "float-right mb-1 ml-3 overflow-hidden bg-cover bg-center",
                compact ? "size-12 rounded-r12" : "size-14 rounded-r14",
                !selfieUrl && "grid place-items-center text-white/60 selfie-thumb",
              )}
            >
              {!selfieUrl && <Icon name="face" filled size={compact ? 20 : 22} />}
            </span>
          )}
          <span
            className={cn(
              "block font-semibold",
              compact ? "text-15 leading-x130" : "text-17 leading-x130",
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "mt-1 block text-fg-2",
              compact ? "text-13 leading-x140" : "text-14 leading-x135",
            )}
          >
            {meta}
          </span>
        </div>
      </div>
      {/* Two equal columns, so the strong action is the same width on every card: it always
          leads, and the rest (grey pills, or the round icon buttons) share the second column. */}
      <div className={cn("mt-auto grid grid-cols-2", compact ? "gap-1.5" : "gap-2")}>
        {strong && (
          <Button
            variant={primary === "bad" ? "destructive" : "strong"}
            size="compact"
            className={cn("w-full", compact && "h-9.5 text-14")}
            onClick={strong.onClick}
          >
            {strong.label}
          </Button>
        )}
        {rest.length > 0 && (
          <div className={cn("flex", compact ? "gap-1.5" : "gap-2")}>
            {rest.map((action) => (
              <Button
                key={action.label}
                variant="secondary"
                size="compact"
                aria-label={action.icon ? action.label : undefined}
                className={cn("min-w-0 flex-1", action.icon && "px-0", compact && "h-9.5 text-14")}
                onClick={action.onClick}
              >
                {action.icon ? (
                  <Icon name={action.icon} filled size={compact ? 18 : 20} />
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
