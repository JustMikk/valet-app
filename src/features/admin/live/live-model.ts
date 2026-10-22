import type { IconName } from "@/lib/icons/icon-names"
import type { StatusSpec } from "@/lib/status/presets"
import type { LiveEvent, LiveSlot, SlotState } from "@/mocks/admin-live"

/** How each slot state reads: tone, glyph and words (Live Board "ST"). */
export const SLOT_STATUS: Record<SlotState, StatusSpec> = {
  onsite: { tone: "ok", icon: "verified", filled: true, label: "On site" },
  flagged: { tone: "warn", icon: "flag", filled: true, label: "Flagged" },
  late: { tone: "warn", icon: "running_with_errors", filled: true, label: "Late 19m" },
  waiting: { tone: "info", icon: "front_hand", filled: true, label: "Approval" },
  due: { tone: "strong", icon: "timer", filled: true, label: "Due now" },
  upcoming: { tone: "neutral", icon: "schedule", filled: true, label: "Assigned" },
  open: { tone: "outline", icon: "person_add", filled: false, label: "Open" },
  override: { tone: "warn", icon: "verified_user", filled: true, label: "Override" },
}

/** Bar segment fill per state; open slots are hatched instead. */
export const SEGMENT_FILL: Record<Exclude<SlotState, "open">, string> = {
  onsite: "bg-ok",
  flagged: "bg-ok",
  override: "bg-ok",
  waiting: "bg-info",
  late: "bg-warn",
  due: "bg-fg-3-line",
  upcoming: "bg-fg-3-line",
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
  eventId: string
  slotIndex: number
  actions: { id: ActionId; label: string }[]
}

export type Pulse = { need: number; live: number; onShift: number; expected: number; open: number }

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

const first = (name: string) => name.split(" ")[0] ?? name
const venueName = (venue: string) => venue.split(" ·")[0] ?? venue

/** Everything the board shows, derived from the events and who has been messaged. */
export function deriveBoard(events: LiveEvent[], messaged: Record<string, true>) {
  const summaries = events.map(summarizeEvent).sort((a, b) => a.health.rank - b.health.rank)
  const attention: AttentionItem[] = []

  for (const event of events) {
    const summary = summaries.find((s) => s.id === event.id)
    if (!summary) continue
    const { counts } = summary

    if (event.live && counts.open) {
      attention.push({
        key: `short-${event.id}`,
        kind: "short",
        rank: 0,
        tone: "bad",
        icon: "error",
        title: `${event.venue} is short ${counts.open}`,
        sub: "Live since 6:00 PM · late drop by Cole B. at 5:12 PM · open 52 min",
        short: `Live · ${counts.open} open`,
        selfie: false,
        eventId: event.id,
        slotIndex: -1,
        actions: [
          { id: "assign", label: "Assign" },
          { id: "broadcast", label: "Broadcast" },
        ],
      })
    }

    event.slots.forEach((slot, i) => {
      if (slot.state === "late") {
        const sent = messaged[`${event.id}${i}`]
        attention.push({
          key: `late${event.id}${i}`,
          kind: "late",
          rank: 1,
          tone: "warn",
          icon: "running_with_errors",
          title: `${slot.name} is 19 min late`,
          sub: sent
            ? `${event.venue} · message delivered 6:04 PM · read just now`
            : `${event.venue} · started 5:45 PM · push reminder 5:55 PM`,
          short: `${event.venue} · 19 min`,
          selfie: false,
          eventId: event.id,
          slotIndex: i,
          actions: [
            { id: sent ? "message-again" : "message", label: sent ? "Message again" : "Message" },
            { id: "call", label: "Call" },
            { id: "replace", label: "Replace" },
          ],
        })
      }
      if (slot.state === "waiting") {
        attention.push({
          key: `wait${event.id}${i}`,
          kind: "waiting",
          rank: 1.5,
          tone: "info",
          icon: "front_hand",
          title: `${slot.name} asks to clock in`,
          sub: `${event.venue} · 212 m outside fence, ±64 m · “Garage level 3” · waiting 6 min`,
          short: `${event.venue} · waiting 6 min`,
          selfie: true,
          eventId: event.id,
          slotIndex: i,
          actions: [
            { id: "approve", label: "Approve" },
            { id: "reject", label: "Reject" },
          ],
        })
      }
    })

    if (!event.live && counts.open && event.start < 22.07) {
      attention.push({
        key: `unf${event.id}`,
        kind: "unfilled",
        rank: 2,
        tone: "warn",
        icon: "person_add",
        title: `${event.venue}: ${counts.open} slots unfilled`,
        sub: "Starts 7:30 PM (in 1h 26m) · 4-hour alert",
        short: "Starts in 1h 26m",
        selfie: false,
        eventId: event.id,
        slotIndex: -1,
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
        status: SLOT_STATUS[slot.state],
      })),
  )
}

export { first, venueName }
