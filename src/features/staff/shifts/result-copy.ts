// Outcome screens for a claim or a drop. Copy is the design's, filled in from the real shift; with
// no shift in hand (a reload, a demo link) it falls back to the design's example.
import type { ClaimResult, DropResult } from "@/lib/data"

export type ResultKey = "claimed" | "filled" | "overlap" | "dropped"

type Tone = "ok" | "fg" | "warn"
type Icon = "check" | "group_off" | "event_busy" | "undo"
export type ResultContent = {
  title: string
  body: string
  primaryLabel: string
  primaryHref: string
  icon: Icon
  tone: Tone
}

export type ResultFacts = {
  venue: string
  dateLabel: string
  timeLabel: string
  conflict?: ClaimResult["conflict"]
  late?: boolean
}

export const RESULT_EXAMPLES: Record<ResultKey, ResultFacts> = {
  claimed: {
    venue: "Harbor Pavilion · Brunch",
    dateLabel: "Sun Oct 25",
    timeLabel: "10:00 AM – 3:00 PM",
  },
  filled: { venue: "The Grand Hotel", dateLabel: "Wed Oct 28", timeLabel: "5:00 – 10:00 PM" },
  overlap: {
    venue: "The Laurel Club",
    dateLabel: "Fri Oct 23",
    timeLabel: "7:30 PM – 1:00 AM",
    conflict: {
      venue: "The Grand Hotel",
      dayWord: "Today",
      range: "6:00 – 11:00 PM",
      isToday: true,
    },
  },
  dropped: {
    venue: "Harbor Pavilion",
    dateLabel: "Sat Oct 24",
    timeLabel: "4:00 – 11:30 PM",
    late: true,
  },
}

export const factsFromClaim = (result: ClaimResult): ResultFacts => result
export const factsFromDrop = (result: DropResult): ResultFacts => result

export function resultContent(key: ResultKey, f: ResultFacts): ResultContent {
  switch (key) {
    case "claimed":
      return {
        title: "It’s yours.",
        body: `${f.venue}, ${f.dateLabel}, ${f.timeLabel} is now in your shifts. Dispatch has been notified.`,
        primaryLabel: "View in my shifts",
        primaryHref: "/staff/shifts",
        icon: "check",
        tone: "ok",
      }
    case "filled":
      return {
        title: "Just filled.",
        body: `Someone claimed the last spot at ${f.venue} (${f.dateLabel}) a moment before you. Other open shifts are still available.`,
        primaryLabel: "See remaining shifts",
        primaryHref: "/staff/open",
        icon: "group_off",
        tone: "fg",
      }
    case "overlap": {
      const c = f.conflict
      return {
        title: "That overlaps a shift you hold.",
        body: c
          ? `${f.venue} (${f.timeLabel}) overlaps ${c.venue} ${c.isToday ? "tonight" : c.dayWord} (${c.range}). You can only hold one at a time.`
          : `${f.venue} (${f.timeLabel}) overlaps a shift you hold. You can only hold one at a time.`,
        primaryLabel: c ? `View my ${c.venue.replace(/^The /, "")} shift` : "View my shifts",
        primaryHref: c?.isToday ? "/staff" : "/staff/shifts",
        icon: "event_busy",
        tone: "warn",
      }
    }
    case "dropped":
      return {
        title: "Shift dropped.",
        body: `${f.venue} (${f.dateLabel}) has been reopened${
          f.late
            ? ", and dispatch was alerted it’s a late drop. Thanks for letting us know early."
            : ". Dispatch has been notified."
        }`,
        primaryLabel: "Back to my shifts",
        primaryHref: "/staff/shifts",
        icon: "undo",
        tone: "fg",
      }
  }
}
