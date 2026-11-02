import { Icon, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"
import type { LiveSlot, SlotState } from "@/lib/data"
import {
  SEGMENT_FILL,
  slotStatus,
  type ActionId,
  type AttentionItem,
  type Pulse,
} from "@/lib/live/model"

export const HEALTH_TEXT = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-info",
} as const

/** Pulsing "Live" marker; the word keeps it from being colour alone. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-semibold text-accent-text", className)}
    >
      <span aria-hidden="true" className="size-2 animate-blink rounded-r9 bg-accent" />
      Live
    </span>
  )
}

const STAT_CARD = "relative flex flex-col rounded-r18 border border-line bg-elev"

/**
 * Change against the same time yesterday, per pulse count. Example figures until the board
 * API returns the earlier counts (UI only, ADR-020).
 */
export const PULSE_TREND: Record<keyof Pulse, number> = {
  need: 2,
  live: 1,
  onShift: 2,
  expected: -1,
  open: 0,
}

/** Whether a rise is good news for the count: more crew on shift is; more people needed is not. */
const UP_IS_GOOD: Record<keyof Pulse, boolean> = {
  need: false,
  live: true,
  onShift: true,
  expected: false,
  open: false,
}

/** "↑ 2" as a small pill: green tint when the change is good news, red tint when bad, grey when flat. */
export function Trend({ kpi, className }: { kpi: keyof Pulse; className?: string }) {
  const delta = PULSE_TREND[kpi]
  const good = delta > 0 === UP_IS_GOOD[kpi]
  return (
    <span
      aria-label={
        delta === 0
          ? "No change since yesterday"
          : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} since yesterday`
      }
      className={cn(
        "inline-flex h-6 items-center gap-0.5 rounded-pill pr-2 pl-1.5 text-12 font-semibold tabular-nums",
        delta === 0 ? "bg-surface text-fg-3" : good ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad",
        className,
      )}
    >
      <Icon
        name={delta === 0 ? "arrow_back" : "arrow_upward"}
        size={15}
        className={cn(delta <= 0 && "rotate-180")}
      />
      {Math.abs(delta)}
    </span>
  )
}

/**
 * Phone pulse (Regency mockups): the "need you" count as a tall lead card, the other four
 * counts in two rows beside it. Labels are the desktop KPI words, shortened to one line.
 */
export function PhoneStats({ pulse }: { pulse: Pulse }) {
  const small: [keyof Pulse, string][] = [
    ["live", "Events live"],
    ["onShift", "On shift"],
    ["expected", "Expected"],
    ["open", "Open slots"],
  ]
  return (
    <div className="grid grid-cols-[minmax(0,1.1fr)_repeat(2,minmax(0,1fr))] gap-2">
      <div className={cn(STAT_CARD, "row-span-2 justify-between gap-1 p-3.5")}>
        <div className="flex items-center justify-between gap-1">
          <LiveDot className="text-13" />
          <Trend kpi="need" />
        </div>
        <span className="inline-flex overflow-hidden font-display text-72 leading-x090 font-bold tracking-n050 text-bad tabular-nums">
          <span key={pulse.need} className="inline-block animate-roll">
            {pulse.need}
          </span>
        </span>
        <span className="text-15 font-medium">Need you</span>
      </div>
      {small.map(([kpi, label]) => (
        <div key={label} className={cn(STAT_CARD, "gap-0.5 p-3")}>
          <Trend kpi={kpi} className="absolute top-2 right-2" />
          <span className="font-display text-24 leading-x110 font-bold tracking-n030 tabular-nums">
            {pulse[kpi]}
          </span>
          <span className="truncate text-12 text-fg-2">{label}</span>
        </div>
      ))}
    </div>
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

/** One segment per person: on site, approval, late, expected; open slots are an empty track. */
export function SlotBar({ bar, label, grow = true, className }: SlotBarProps) {
  return (
    <div role="img" aria-label={label} className={cn("flex h-1.5 w-full gap-1", className)}>
      {bar.map((state, i) => (
        <div
          key={i}
          style={grow ? { animationDelay: `${120 + i * 40}ms` } : undefined}
          className={cn(
            "flex-1 rounded-pill transition-colors duration-400",
            state === "open" ? "bg-surface-2" : SEGMENT_FILL[state],
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
  /** Called when a non-open slot is tapped to view the staff member's photo + location. */
  onView?: (slot: LiveSlot) => void
}

const VIEWABLE: import("@/lib/data/admin/ops-schemas").SlotState[] = [
  "onsite",
  "flagged",
  "override",
  "waiting",
]

/** One slot in an event roster: avatar, name and evidence, then its status or Assign. */
export function SlotRow({ slot, onAssign, compact = false, onView }: SlotRowProps) {
  const open = slot.state === "open"
  const viewable = onView && VIEWABLE.includes(slot.state)
  const initials = slot.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)

  const inner = (
    <>
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
      {viewable && <Icon name="chevron_right" size={18} className="shrink-0 text-fg-3" />}
    </>
  )

  return (
    <li
      className={cn(
        "box-content flex items-center gap-3 border-b border-line",
        compact ? "min-h-16" : "min-h-17.5",
        viewable && "cursor-pointer",
      )}
    >
      {viewable ? (
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left"
          onClick={() => onView(slot)}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  )
}

type CardAction = { label: string; onClick: () => void; icon?: IconName }

/** Reaching someone is a quick tap: these actions are round icon buttons on the card. */
const ICON_ACTIONS: Partial<Record<ActionId, IconName>> = {
  message: "chat_bubble",
  "message-again": "chat_bubble",
  call: "call",
}

/** The attention card's action tuple (first strong, then up to two secondary) for one item. */
export function attentionActions(
  item: AttentionItem,
  run: (item: AttentionItem, action: ActionId) => void,
): [CardAction, CardAction?, CardAction?] {
  const [a, b, c] = item.actions.map((action) => ({
    label: action.label,
    onClick: () => run(item, action.id),
    icon: ICON_ACTIONS[action.id],
  }))
  if (!a) throw new Error(`Attention item ${item.key} has no actions`)
  return [a, b, c]
}
