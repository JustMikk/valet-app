// One valet's activity log (ADR-024), built from what the system already records: claims and
// assignments, drops, every clock-in and clock-out, corrections, payments and no-shows. Newest
// first, worded for an admin, with anything that needs attention marked as an issue.
import { formatMoney } from "@/lib/money/format"
import { formatDate, formatTime } from "@/lib/time/labels"

import { GRACE_MIN } from "./valet-stats"

export type ActivityKind =
  | "invited"
  | "joined"
  | "claimed"
  | "assigned"
  | "dropped"
  | "removed"
  | "clock_in"
  | "clock_out"
  | "adjusted"
  | "paid"
  | "no_show"

export type ActivityItem = {
  id: string
  at: Date
  /** Venue-local: "Wed Nov 4 · 5:57 PM". */
  when: string
  kind: ActivityKind
  title: string
  detail: string
  issue: boolean
}

type Where = { event: string; tz: string }

export type ActivityFacts = {
  invitedAt: Date | null
  onboardedAt: Date | null
  shifts: (Where & {
    id: string
    startsAt: Date
    endsAt: Date
    cancelled: boolean
    claimedAt: Date | null
    assignedAt: Date | null
    assignedBy: string | null
    clockedInAt: Date | null
    clockedOutAt: Date | null
    paidAt: Date | null
    paidCents: number | null
  })[]
  drops: (Where & {
    id: string
    at: Date
    reason: string
    note: string | null
    late: boolean
    removedBy: string | null
  })[]
  punches: (Where & {
    id: string
    at: Date
    startsAt: Date
    kind: "in" | "out"
    geofence: "inside" | "outside" | "low_accuracy" | "unknown"
    distanceM: number | null
    status: "accepted" | "pending_approval" | "approved" | "rejected"
    flagged: boolean
    flagReason: string | null
    offline: boolean
  })[]
  adjustments: (Where & { id: string; at: Date; reason: string; by: string })[]
}

const whenOf = (at: Date, tz: string) => `${formatDate(at, tz)} · ${formatTime(at, tz)}`
const joinParts = (parts: (string | false | null)[]) => parts.filter(Boolean).join(" · ")

const FENCE: Record<ActivityFacts["punches"][number]["geofence"], string> = {
  inside: "Inside the fence",
  outside: "Outside the fence",
  low_accuracy: "Location too imprecise",
  unknown: "No location",
}

const DECISION: Partial<Record<ActivityFacts["punches"][number]["status"], string>> = {
  pending_approval: "Waiting for approval",
  approved: "Approved by an admin",
  rejected: "Rejected by an admin",
}

function punchItem(punch: ActivityFacts["punches"][number]): ActivityItem {
  const base = { id: `punch-${punch.id}`, at: punch.at, when: whenOf(punch.at, punch.tz) }
  const offline = punch.offline && "Sent when back online"
  if (punch.kind === "out") {
    return {
      ...base,
      kind: "clock_out",
      title: `Clocked out · ${punch.event}`,
      detail: joinParts([punch.flagged && (punch.flagReason || "Flagged"), offline]),
      issue: punch.flagged,
    }
  }
  const lateMin = Math.round((punch.at.getTime() - punch.startsAt.getTime()) / 60_000)
  const fence =
    punch.geofence === "outside" && punch.distanceM !== null
      ? `${punch.distanceM} m outside the fence`
      : FENCE[punch.geofence]
  return {
    ...base,
    kind: "clock_in",
    title: `Clocked in · ${punch.event}`,
    detail: joinParts([
      lateMin > GRACE_MIN ? `${lateMin} min late` : "On time",
      fence,
      DECISION[punch.status] ?? null,
      offline,
    ]),
    issue:
      lateMin > GRACE_MIN ||
      punch.geofence !== "inside" ||
      punch.status === "pending_approval" ||
      punch.status === "rejected",
  }
}

export function valetActivity(facts: ActivityFacts, now: Date, tenantTz = "UTC"): ActivityItem[] {
  const items: ActivityItem[] = []
  const plain = (
    id: string,
    at: Date,
    tz: string,
    kind: ActivityKind,
    title: string,
    detail = "",
  ) => items.push({ id, at, when: whenOf(at, tz), kind, title, detail, issue: false })

  if (facts.invitedAt) plain("invited", facts.invitedAt, tenantTz, "invited", "Invited to the app")
  if (facts.onboardedAt) plain("joined", facts.onboardedAt, tenantTz, "joined", "Finished sign-up")

  for (const s of facts.shifts) {
    const forShift = `For ${whenOf(s.startsAt, s.tz)}`
    if (s.claimedAt)
      plain(`claim-${s.id}`, s.claimedAt, s.tz, "claimed", `Claimed ${s.event}`, forShift)
    if (s.assignedAt) {
      plain(
        `assign-${s.id}`,
        s.assignedAt,
        s.tz,
        "assigned",
        `Assigned to ${s.event}`,
        `By ${s.assignedBy ?? "an admin"}`,
      )
    }
    if (s.paidAt && s.paidCents !== null) {
      plain(`paid-${s.id}`, s.paidAt, s.tz, "paid", `Paid ${formatMoney(s.paidCents)} · ${s.event}`)
    }
    if (!s.cancelled && s.clockedInAt === null && s.endsAt < now) {
      items.push({
        id: `noshow-${s.id}`,
        at: s.endsAt,
        when: whenOf(s.endsAt, s.tz),
        kind: "no_show",
        title: `No-show · ${s.event}`,
        detail: forShift,
        issue: true,
      })
    }
  }

  for (const d of facts.drops) {
    if (d.removedBy) {
      plain(`drop-${d.id}`, d.at, d.tz, "removed", `Removed from ${d.event}`, `By ${d.removedBy}`)
      continue
    }
    items.push({
      id: `drop-${d.id}`,
      at: d.at,
      when: whenOf(d.at, d.tz),
      kind: "dropped",
      title: `Dropped ${d.event}`,
      detail: joinParts([
        d.late ? "Within 24 hours" : "With notice",
        d.reason,
        d.note && `“${d.note}”`,
      ]),
      issue: d.late,
    })
  }

  for (const p of facts.punches) items.push(punchItem(p))
  for (const h of facts.adjustments) {
    plain(
      `adjust-${h.id}`,
      h.at,
      h.tz,
      "adjusted",
      `Hours corrected · ${h.event}`,
      `By ${h.by}: ${h.reason}`,
    )
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime())
}
