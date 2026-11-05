// The Live Board's derived view: health, coverage bars and the attention queue, computed from
// events and slots (their states and facts). Pure and shared: the server counts what needs the
// dispatcher for the navigation badge, the screens render it. Wording is built from facts
// (minutes late, distance outside, who dropped), never stored as prose.
import type { LiveEvent, LiveSlot, Pulse, SlotState } from "@/lib/data/admin/ops-schemas"
import type { IconName } from "@/lib/icons/icon-names"
import type { StatusSpec } from "@/lib/status/presets"

/** How each slot state reads: tone, glyph and words. Late carries its minutes. */
export function slotStatus(slot: Pick<LiveSlot, "state" | "facts">): StatusSpec {
  switch (slot.state) {
    case "onsite":
      return { tone: "ok", icon: "verified", filled: true, label: "On site" }
    case "flagged":
      return { tone: "warn", icon: "flag", filled: true, label: "Flagged" }
    case "late":
      return {
        tone: "warn",
        icon: "running_with_errors",
        filled: true,
        label: `Late ${slot.facts.lateMin ?? 0}m`,
      }
    case "waiting":
      return { tone: "info", icon: "front_hand", filled: true, label: "Approval" }
    case "due":
      return { tone: "strong", icon: "timer", filled: true, label: "Due now" }
    case "upcoming":
      return { tone: "neutral", icon: "schedule", filled: true, label: "Assigned" }
    case "open":
      return { tone: "outline", icon: "person_add", filled: false, label: "Open" }
    case "override":
      return { tone: "warn", icon: "verified_user", filled: true, label: "Override" }
  }
}

/** Bar segment fill per state; open slots are hatched instead. */
// Silver bars (client palette, ADR-020): on site silver, needs a decision mid grey, expected a
// lighter silver, late gold; the bar's label says it in words.
export const SEGMENT_FILL: Record<Exclude<SlotState, "open">, string> = {
  onsite: "bg-fg-3-line",
  flagged: "bg-fg-3-line",
  override: "bg-fg-3-line",
  waiting: "bg-fg-3",
  late: "bg-accent",
  due: "bg-fg-3-line/45",
  upcoming: "bg-fg-3-line/45",
}

const BAR_ORDER: SlotState[] = [
  "onsite",
  "flagged",
  "override",
  "waiting",
  "late",
  "due",
  "upcoming",
  "open",
]
const SHEET_ORDER: SlotState[] = [
  "late",
  "waiting",
  "open",
  "due",
  "flagged",
  "override",
  "onsite",
  "upcoming",
]

export type Counts = { onsite: number; waiting: number; late: number; exp: number; open: number }

export type Health = {
  status: StatusSpec & { tone: "ok" | "warn" | "bad" | "info" }
  /** Lower sorts first. */
  rank: number
}

export type EventSummary = LiveEvent & {
  counts: Counts
  health: Health
  /** Slot states in bar order. */
  bar: SlotState[]
  legend: string
  filledOf: string
}

export type ActionId =
  "assign" | "broadcast" | "message" | "message-again" | "call" | "replace" | "approve" | "reject"
export type AttentionKind = "short" | "late" | "waiting" | "unfilled"

export type AttentionItem = {
  key: string
  kind: AttentionKind
  rank: number
  tone: "bad" | "warn" | "info"
  icon: IconName
  title: string
  sub: string
  /** One-line version for the timeline tab. */
  short: string
  selfie: boolean
  /** Actual selfie image URL from the clock-in punch, when present. */
  selfieUrl?: string | null
  eventId: string
  slotIndex: number
  /** The slot this is about (a person), when there is one. */
  slotId: string | null
  /** The pending clock-in request, for Approve / Reject. */
  punchId: string | null
  actions: { id: ActionId; label: string }[]
}

export type { Pulse }

/** Unfilled events inside this many minutes of starting raise an alert (the "4-hour alert"). */
export const UNFILLED_ALERT_MIN = 4 * 60

function countSlots(slots: LiveSlot[]): Counts {
  const c: Counts = { onsite: 0, waiting: 0, late: 0, exp: 0, open: 0 }
  for (const { state } of slots) {
    if (state === "onsite" || state === "flagged" || state === "override") c.onsite++
    else if (state === "waiting") c.waiting++
    else if (state === "late") c.late++
    else if (state === "open") c.open++
    else c.exp++
  }
  return c
}

function healthOf(event: LiveEvent, c: Counts): Health {
  if (event.live && c.open)
    return {
      status: { tone: "bad", icon: "error", filled: true, label: `Short ${c.open}` },
      rank: 0,
    }
  if (c.late)
    return {
      status: { tone: "warn", icon: "running_with_errors", filled: true, label: "Running late" },
      rank: 1,
    }
  if (c.waiting)
    return {
      status: { tone: "info", icon: "front_hand", filled: true, label: "Needs decision" },
      rank: 1.5,
    }
  if (c.open)
    return {
      status: { tone: "warn", icon: "person_add", filled: true, label: `Unfilled ${c.open}` },
      rank: 2,
    }
  return { status: { tone: "ok", icon: "check_circle", filled: true, label: "On track" }, rank: 5 }
}

function legendOf(c: Counts): string {
  const parts = [`${c.onsite} on site`]
  if (c.waiting) parts.push(`${c.waiting} approval`)
  if (c.late) parts.push(`${c.late} late`)
  if (c.exp) parts.push(`${c.exp} expected`)
  if (c.open) parts.push(`${c.open} open`)
  return parts.join(" · ")
}

export function summarizeEvent(event: LiveEvent): EventSummary {
  const counts = countSlots(event.slots)
  const total = event.slots.length
  return {
    ...event,
    counts,
    health: healthOf(event, counts),
    bar: event.slots
      .map((s) => s.state)
      .sort((a, b) => BAR_ORDER.indexOf(a) - BAR_ORDER.indexOf(b)),
    legend: legendOf(counts),
    filledOf: `${total - counts.open}/${total} filled`,
  }
}

export const first = (name: string) => name.split(" ")[0] ?? name
export const venueName = (venue: string) => venue.split(" ·")[0] ?? venue

/** "1h 26m" or "52 min": how long until or since something, for sentences. */
export function spanLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  const rest = m % 60
  return rest === 0 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 60)}h ${rest}m`
}

/** Why the first open slot is open, in a clause: "late drop by Cole B. at 5:12 PM". */
function openReason(slot: LiveSlot | undefined): string {
  const f = slot?.facts
  if (f?.droppedBy && f.droppedAt) return `drop by ${f.droppedBy} at ${f.droppedAt}`
  return "unfilled since posting"
}

/** Everything the board shows, derived from the events and who has been messaged. */
export function deriveBoard(events: LiveEvent[], messaged: Record<string, true>) {
  const summaries = events.map(summarizeEvent).sort((a, b) => a.health.rank - b.health.rank)
  const attention: AttentionItem[] = []

  for (const event of events) {
    const summary = summaries.find((s) => s.id === event.id)
    if (!summary) continue
    const { counts } = summary

    if (event.live && counts.open) {
      const firstOpen = event.slots.find((s) => s.state === "open")
      attention.push({
        key: `short-${event.id}`,
        kind: "short",
        rank: 0,
        tone: "bad",
        icon: "error",
        title: `${event.venue} is short ${counts.open}`,
        sub: `Live since ${event.startLabel} · ${openReason(firstOpen)} · open ${spanLabel(firstOpen?.facts.openMin ?? -event.startsInMin)}`,
        short: `Live · ${counts.open} open`,
        selfie: false,
        eventId: event.id,
        slotIndex: -1,
        slotId: null,
        punchId: null,
        actions: [
          { id: "assign", label: "Assign" },
          { id: "broadcast", label: "Broadcast" },
        ],
      })
    }

    event.slots.forEach((slot, i) => {
      if (slot.state === "late") {
        const sent = Boolean(messaged[slot.id] || slot.facts.nudgedAt)
        const at = slot.facts.nudgedAt
        attention.push({
          key: `late${slot.id}`,
          kind: "late",
          rank: 1,
          tone: "warn",
          icon: "running_with_errors",
          title: `${slot.name} is ${slot.facts.lateMin ?? 0} min late`,
          sub: sent
            ? `${event.venue} · message delivered${at ? ` ${at}` : ""} · read just now`
            : `${event.venue} · started ${event.startLabel}`,
          short: `${event.venue} · ${slot.facts.lateMin ?? 0} min`,
          selfie: false,
          eventId: event.id,
          slotIndex: i,
          slotId: slot.id,
          punchId: null,
          actions: [
            { id: sent ? "message-again" : "message", label: sent ? "Message again" : "Message" },
            { id: "call", label: "Call" },
            { id: "replace", label: "Replace" },
          ],
        })
      }
      if (slot.state === "waiting") {
        const f = slot.facts
        attention.push({
          key: `wait${slot.id}`,
          kind: "waiting",
          rank: 1.5,
          tone: "info",
          icon: "front_hand",
          title: `${slot.name} asks to clock in`,
          sub: `${event.venue} · ${f.outsideM ?? 0} m outside fence, ±${f.accuracyM ?? 0} m${f.note ? ` · "${f.note}"` : ""} · waiting ${f.waitedMin ?? 0} min`,
          short: `${event.venue} · waiting ${f.waitedMin ?? 0} min`,
          selfie: true,
          selfieUrl: slot.selfieUrl,
          eventId: event.id,
          slotIndex: i,
          slotId: slot.id,
          punchId: f.punchId ?? null,
          actions: [
            { id: "approve", label: "Approve" },
            { id: "reject", label: "Reject" },
          ],
        })
      }
    })

    if (!event.live && counts.open && event.startsInMin <= UNFILLED_ALERT_MIN) {
      attention.push({
        key: `unf${event.id}`,
        kind: "unfilled",
        rank: 2,
        tone: "warn",
        icon: "person_add",
        title: `${event.venue}: ${counts.open} slots unfilled`,
        sub: `Starts ${event.startLabel} (in ${spanLabel(event.startsInMin)}) · 4-hour alert`,
        short: `Starts in ${spanLabel(event.startsInMin)}`,
        selfie: false,
        eventId: event.id,
        slotIndex: -1,
        slotId: null,
        punchId: null,
        actions: [
          { id: "assign", label: "Assign" },
          { id: "broadcast", label: "Broadcast" },
        ],
      })
    }
  }
  attention.sort((a, b) => a.rank - b.rank)

  const pulse: Pulse = { need: attention.length, live: 0, onShift: 0, expected: 0, open: 0 }
  for (const s of summaries) {
    if (s.live) {
      pulse.live++
      pulse.expected += s.counts.exp + s.counts.late
    }
    pulse.onShift += s.counts.onsite
    pulse.open += s.counts.open
  }

  return { summaries, attention, pulse }
}

/** Slots of one event in the order the roster shows them (problems first). */
export function sheetSlots(event: LiveEvent) {
  return event.slots
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => SHEET_ORDER.indexOf(a.slot.state) - SHEET_ORDER.indexOf(b.slot.state))
}

/** People for the People tab: everyone on a live event, filtered by name. */
export function boardPeople(events: LiveEvent[], query: string) {
  const q = query.trim().toLowerCase()
  return events.flatMap((event) =>
    event.slots
      .filter((slot) => slot.state !== "open" && (event.live || slot.state !== "upcoming"))
      .filter((slot) => !q || slot.name.toLowerCase().includes(q))
      .map((slot) => ({
        name: slot.name,
        where: `${event.venue} · ${slot.meta.split(" · ")[0]}`,
        status: slotStatus(slot),
      })),
  )
}
