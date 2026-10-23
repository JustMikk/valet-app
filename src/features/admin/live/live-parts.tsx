import { Icon, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LiveSlot, SlotState } from "@/lib/data"
import { SEGMENT_FILL, slotStatus, type ActionId, type AttentionItem } from "@/lib/live/model"

export const HEALTH_TEXT = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-info",
} as const

/** Pulsing "Live" marker; the word keeps it from being colour alone. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold text-ok", className)}>
      <span aria-hidden="true" className="size-2 animate-blink rounded-r9 bg-ok" />
      Live
    </span>
  )
}

type SlotBarProps = {
  bar: SlotState[]
  /** The words the bar stands for, e.g. "4 on site · 2 open". */
  label: string
  /** Segments grow in from the left; off for the timeline's compact bars. */
  grow?: boolean
  className?: string
}

/** One segment per person: on site, approval, late, expected; open slots are hatched. */
export function SlotBar({ bar, label, grow = true, className }: SlotBarProps) {
  return (
    <div role="img" aria-label={label} className={cn("flex h-2.5 w-full gap-0.75", className)}>
      {bar.map((state, i) => (
        <div
          key={i}
          style={grow ? { animationDelay: `${120 + i * 40}ms` } : undefined}
          className={cn(
            "flex-1 rounded-r3 transition-colors duration-400",
            state === "open"
              ? "shadow-[inset_0_0_0_1.5px_var(--fg-3-line)] hatch-open"
              : SEGMENT_FILL[state],
            grow && "origin-left animate-grow",
          )}
        />
      ))}
    </div>
  )
}

type SlotRowProps = {
  slot: LiveSlot
  onAssign: () => void
  /** Desktop roster: 64 px rows, 15 px names, 36 px Assign. */
  compact?: boolean
}

/** One slot in an event roster: avatar, name and evidence, then its status or Assign. */
export function SlotRow({ slot, onAssign, compact = false }: SlotRowProps) {
  const open = slot.state === "open"
  const initials = slot.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
  return (
    <li
      className={cn(
        "box-content flex items-center gap-3 border-b border-line",
        compact ? "min-h-16" : "min-h-17.5",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10.5 flex-none place-items-center rounded-pill text-14 font-semibold",
          open ? "text-fg-2 shadow-[inset_0_0_0_1.5px_var(--fg-3-line)]" : "bg-surface-2",
        )}
      >
        {open ? <Icon name="person_add" size={20} /> : initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("font-semibold", compact ? "text-15" : "text-16")}>{slot.name}</span>
        <span className="text-13 leading-x130 text-fg-2">{slot.meta}</span>
      </div>
      {open ? (
        <Button
          variant="strong"
          size="xs"
          className={cn(compact ? "h-9 px-3.5" : "px-4 text-15")}
          onClick={onAssign}
        >
          Assign
        </Button>
      ) : (
        <StatusBadge status={slotStatus(slot)} size="sm" />
      )}
    </li>
  )
}

type CardAction = { label: string; onClick: () => void }

/** The attention card's action tuple (first strong, then up to two secondary) for one item. */
export function attentionActions(
  item: AttentionItem,
  run: (item: AttentionItem, action: ActionId) => void,
): [CardAction, CardAction?, CardAction?] {
  const [a, b, c] = item.actions.map((action) => ({
    label: action.label,
    onClick: () => run(item, action.id),
  }))
  if (!a) throw new Error(`Attention item ${item.key} has no actions`)
  return [a, b, c]
}
