// In-memory StaffRepo over the design's fixtures. It is what the static export (Capacitor-ready
// build, no server) runs on, and it mirrors the server's rules closely enough for the same screens:
// clock state, claims, drops and messages change in memory and reset on reload.
import { classifyFix } from "@/lib/geo/geofence"
import { CLOCK_VENUE } from "@/mocks/clock"
import { ONBOARDING_INVITE } from "@/mocks/onboarding"
import {
  CHAT_MESSAGES,
  HARBOR_DETAIL as D,
  NOTIFICATION_GROUPS,
  OPEN_SHIFTS,
  PAST_SHIFTS,
  STAFF_USER,
  TONIGHT,
  UPCOMING_SHIFTS,
  UP_NEXT,
} from "@/mocks/staff"

import type { StaffRepo } from "./repo"
import type {
  ChatItem,
  ClaimResult,
  ClockPunch,
  Home,
  Notifications,
  ShiftCard,
  StaffProfile,
} from "./schemas"

const MIN = 60_000
const GRAND = { lat: 37.7937, lng: -122.3965 }
const wait = <T>(value: T): Promise<T> => Promise.resolve(value)

type ClockState = { mode: "before" | "due" | "onshift"; clockedInAt: number | null }
const clock: ClockState = { mode: "due", clockedInAt: null }
let approved = false

const profile: StaffProfile = {
  id: "jordan",
  initials: STAFF_USER.initials,
  name: STAFF_USER.name,
  role: STAFF_USER.role,
  email: STAFF_USER.email,
  company: STAFF_USER.company,
  accent: "#C9A24A",
  phone: STAFF_USER.phone,
  preferences: { open: true, remind: true, msg: true },
  permissions: { push: true, location: true, camera: true, installed: true },
}

const claimed = new Set<string>()
const dropped = new Set<string>()
const sent: { id: string; text: string; at: number }[] = []
let unread = 3

function homeShift(now: number): Home["shift"] {
  const onShift = clock.mode === "onshift" && clock.clockedInAt !== null
  const clockedIn = clock.clockedInAt ?? now - TONIGHT.demoElapsedSecs * 1000
  const starts = onShift ? clockedIn + 9 * MIN : now + (clock.mode === "before" ? 105 : 12) * MIN
  const ends = onShift ? clockedIn + TONIGHT.scheduledSecs * 1000 : starts + 300 * MIN
  return {
    assignmentId: "tonight",
    venue: TONIGHT.venue,
    address: TONIGHT.address,
    shortAddress: "400 Market St",
    mapsUrl: TONIGHT.mapsUrl,
    venueGeo: GRAND,
    timezone: "America/Los_Angeles",
    radiusM: CLOCK_VENUE.radiusM,
    neededAccuracyM: CLOCK_VENUE.neededAccuracyM,
    contact: TONIGHT.contact,
    dress: TONIGHT.dress,
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(ends).toISOString(),
    clockInOpensAt: new Date(starts - 15 * MIN).toISOString(),
    windowMin: 15,
    dayWord: "Today",
    dateLabel: "Fri Oct 23",
    startLabel: "6:00 PM",
    endLabel: "11:00 PM",
    rangeLabel: "6:00 – 11:00 PM",
    whenLabel: TONIGHT.when,
    opensLabel: "5:45 PM",
    clockedInAt: onShift ? new Date(clockedIn).toISOString() : null,
    clockedInLabel: onShift ? "5:51 PM" : null,
    clockedInDistanceM: onShift ? 38 : null,
  }
}

function upcoming(): ShiftCard[] {
  return [
    ...UPCOMING_SHIFTS.filter((shift) => !dropped.has(shift.id)).map((shift) => ({
      ...shift,
      isTonight: shift.id === "tonight",
    })),
  ]
}

const CLAIM_DETAILS: Record<string, { dateLabel: string; timeLabel: string }> = {
  laurel: { dateLabel: "Fri Oct 23", timeLabel: "7:30 PM – 1:00 AM" },
  brunch: { dateLabel: "Sun Oct 25", timeLabel: "10:00 AM – 3:00 PM" },
  "grand-wed": { dateLabel: "Wed Oct 28", timeLabel: "5:00 – 10:00 PM" },
  halloween: { dateLabel: "Sat Oct 31", timeLabel: "7:00 PM – 1:00 AM" },
}

function punchResult(
  kind: "in" | "out",
  location: string,
  status: ClockPunch["status"],
): ClockPunch {
  const worked = clock.clockedInAt ? Math.floor((Date.now() - clock.clockedInAt) / 1000) : 0
  return {
    punchId: `mock-${kind}-${Date.now()}`,
    status,
    flagged: false,
    effectiveAt: new Date().toISOString(),
    effectiveLabel: kind === "in" ? CLOCK_VENUE.clockInTime : "8:05 PM",
    venueName: CLOCK_VENUE.name,
    shiftEndLabel: "11:00 PM",
    reportTo: "Priya, front desk",
    locationLabel: location,
    workedSecs: kind === "out" ? worked : null,
  }
}

function chat(now: number): ChatItem[] {
  const base = CHAT_MESSAGES.map((m, index): ChatItem => {
    if (m.kind === "day") return { kind: "day", id: `day-${index}`, text: m.text }
    const { event, ...rest } = m
    return {
      ...rest,
      kind: "message",
      id: `m-${index}`,
      ...(event ? { event: { title: event, meta: "Sat Oct 31 · 7 PM – 1 AM · 4 spots" } } : {}),
    }
  })
  const mine = sent.map((m): ChatItem => ({
    kind: "message",
    id: m.id,
    from: "me",
    text: m.text,
    meta: now - m.at > 2500 ? "Read by Jamie" : "Delivered",
  }))
  return [...base, ...mine]
}

export const mockStaffRepo: StaffRepo = {
  requestCode: () => wait(undefined),
  verifyCode: async (_email, code) => {
    if (code !== ONBOARDING_INVITE.code) throw new Error("That code isn't right.")
    return { token: "mock", expiresAt: new Date(Date.now() + 86_400_000).toISOString() }
  },

  me: () => wait(structuredClone(profile)),
  updateMe: async (patch) => {
    Object.assign(profile.preferences, patch.preferences)
    Object.assign(profile.permissions, patch.permissions)
    return structuredClone(profile)
  },

  home: async () => ({
    shift: homeShift(Date.now()),
    upNext: UP_NEXT.map((item, i) => ({ ...item, assignmentId: i === 0 ? "harbor" : "osteria" })),
    open: {
      count: OPEN_SHIFTS.length,
      titles: ["Harbor Pavilion brunch", "Maison Blanc Halloween gala"],
    },
    serverNow: new Date().toISOString(),
  }),
  shifts: async (tab) =>
    tab === "past" ? PAST_SHIFTS.map((s) => ({ ...s, isTonight: false })) : upcoming(),
  shift: async (id) => ({
    id: id ?? "harbor",
    status: { tone: "muted", icon: "event_available", filled: true, label: D.statusLabel },
    start: D.start,
    title: D.title,
    when: D.when,
    clockNotice: D.clockNotice,
    address: D.address,
    mapsUrl: D.mapsUrl,
    report: D.report,
    crew: D.crew,
    instructions: D.instructions,
    dropVenue: D.dropVenue,
    dropWhen: D.dropWhen,
    canDrop: true,
    lateDrop: true,
  }),
  drop: async (id) => {
    dropped.add(id)
    return { venue: D.dropVenue, dateLabel: "Sat Oct 24", timeLabel: "4:00 – 11:30 PM", late: true }
  },
  openShifts: async () =>
    OPEN_SHIFTS.filter((shift) => !claimed.has(shift.id)).map((shift) => ({
      id: shift.id,
      date: shift.date,
      venue: shift.venue,
      time: shift.time,
      spots: shift.spots,
      ...(shift.conflict ? { conflict: shift.conflict } : {}),
    })),
  claim: async (id): Promise<ClaimResult> => {
    const shift = OPEN_SHIFTS.find((candidate) => candidate.id === id)
    if (!shift) throw new Error("That shift is no longer available.")
    const detail = CLAIM_DETAILS[id]
    if (shift.outcome === "claimed") claimed.add(id)
    return {
      outcome: shift.outcome,
      venue: shift.venue,
      ...detail,
      ...(shift.outcome === "overlap"
        ? {
            conflict: {
              venue: "The Grand Hotel",
              dayWord: "Today",
              range: "6:00 – 11:00 PM",
              isToday: true,
            },
          }
        : {}),
    }
  },

  clockCheck: async ({ location }) => {
    const fence = {
      ...GRAND,
      radiusM: CLOCK_VENUE.radiusM,
      maxAccuracyM: CLOCK_VENUE.neededAccuracyM,
    }
    const result = classifyFix(location, fence)
    return {
      verdict: result.verdict,
      distanceM: result.distanceM,
      radiusM: CLOCK_VENUE.radiusM,
      neededAccuracyM: CLOCK_VENUE.neededAccuracyM,
      venueName: CLOCK_VENUE.name,
      hoursLabel: CLOCK_VENUE.hours,
    }
  },
  clockIn: async (req) => {
    if (req.requestApproval) {
      approved = false
      return punchResult("in", "Outside · 420 m", "pending_approval")
    }
    clock.mode = "onshift"
    clock.clockedInAt = Date.now()
    return punchResult("in", "Inside · 38 m", "accepted")
  },
  clockOut: async () => {
    const result = punchResult("out", "Inside · 41 m", "accepted")
    clock.mode = "before"
    clock.clockedInAt = null
    return result
  },
  clockRequest: async () => ({
    status: approved ? "approved" : "pending_approval",
    requestedLabel: CLOCK_VENUE.requestTime,
    effectiveLabel: approved ? CLOCK_VENUE.requestTime : null,
  }),
  demoApprove: async () => {
    approved = true
    clock.mode = "onshift"
    clock.clockedInAt = Date.now()
  },

  messages: async () => chat(Date.now()),
  sendMessage: async (text) => {
    const id = `sent-${Date.now()}`
    sent.push({ id, text, at: Date.now() })
    return { kind: "message", id, from: "me", text, meta: "Delivered" }
  },
  notifications: async (): Promise<Notifications> => {
    let n = 0
    const groups = NOTIFICATION_GROUPS.map((group) => ({
      label: group.label,
      items: group.items.map((item) => ({ ...item, id: `n-${n++}`, unread: n <= unread })),
    }))
    return { groups, unread }
  },
  markNotificationsRead: async () => {
    unread = 0
  },
}
