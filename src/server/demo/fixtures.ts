// Demo data for Regency Valet Parking, built relative to "now" so the app always has a live shift.
// Names, venues and copy come from the design export and the admin mock (illustrative data, not
// real people). Pure: rows in, no database, so the invariants are unit-tested.
import { randomUUID } from "node:crypto"

import {
  formatCompactRange,
  formatDate,
  formatWeekday,
  wallTime,
  zonedInstant,
} from "@/lib/time/labels"

export type Scenario = "before" | "due" | "onshift"
export const SCENARIOS: readonly Scenario[] = ["before", "due", "onshift"]

const TZ = "America/Los_Angeles"
const MIN = 60_000
const HOUR = 3_600_000
const iso = (date: Date) => date.toISOString()

type VenueKey = "grand" | "harbor" | "maison" | "osteria" | "laurel" | "westfield"
const VENUES: Record<
  VenueKey,
  { name: string; address: string; lat: number; lng: number; radius: number }
> = {
  grand: {
    name: "The Grand Hotel",
    address: "400 Market St, San Francisco",
    lat: 37.7937,
    lng: -122.3965,
    radius: 150,
  },
  harbor: {
    name: "Harbor Pavilion",
    address: "Pier 3, The Embarcadero",
    lat: 37.7955,
    lng: -122.3935,
    radius: 250,
  },
  maison: {
    name: "Maison Blanc",
    address: "88 Fillmore St",
    lat: 37.7727,
    lng: -122.4305,
    radius: 150,
  },
  osteria: {
    name: "Osteria Nove",
    address: "1201 Valencia St",
    lat: 37.7527,
    lng: -122.4206,
    radius: 100,
  },
  laurel: {
    name: "The Laurel Club",
    address: "2 Laurel Ave",
    lat: 37.7869,
    lng: -122.4018,
    radius: 150,
  },
  westfield: {
    name: "Westfield Gala",
    address: "Westfield Centre, L4",
    lat: 37.7842,
    lng: -122.4066,
    radius: 400,
  },
}

const CREW = [
  ["Maya Patel", "maya.patel@example.com"],
  ["Devon Kim", "devon.kim@example.com"],
  ["Luis Torres", "luis.torres@example.com"],
  ["Ari Brooks", "ari.brooks@example.com"],
  ["Sam Rivera", "sam.rivera@example.com"],
  ["Kai Morgan", "kai.morgan@example.com"],
  ["Nia Okafor", "nia.okafor@example.com"],
  ["Rob Chen", "rob.chen@example.com"],
] as const

type EventSpec = {
  key: string
  venue: VenueKey
  title: string
  start: Date
  end: Date
  crew: number
  contact: [text: string, name: string, tel: string]
  dress: string
  instructions: string
  /** Crew indices (into CREW) already holding a slot. */
  filled: number[]
  /** Whether Jordan holds a slot, and how. */
  jordan?: "confirmed" | "claimed"
  past?: { clockIn: Date; clockOut: Date; approved: boolean }
}

export function buildFixtures(now: Date, scenario: Scenario) {
  const today = wallTime(now, TZ)
  /** Venue-local wall time `days` from today. */
  const day = (days: number, hour: number, minute = 0) =>
    zonedInstant(TZ, { year: today.year, month: today.month, day: today.day + days, hour, minute })
  const minutesAgo = (m: number) => new Date(now.getTime() - m * MIN)

  const rounded = (offsetMin: number) =>
    new Date(Math.floor((now.getTime() + offsetMin * MIN) / MIN) * MIN)
  const tonightStart = rounded(scenario === "due" ? 12 : scenario === "before" ? 105 : -125)
  const tonightEnd = new Date(tonightStart.getTime() + 5 * HOUR)
  const laurelStart = new Date(
    Math.max(tonightStart.getTime() + 90 * MIN, now.getTime() + 30 * MIN),
  )

  const specs: EventSpec[] = [
    {
      key: "tonight",
      venue: "grand",
      title: "The Grand Hotel",
      start: tonightStart,
      end: tonightEnd,
      crew: 6,
      contact: ["Ask for Priya, front desk", "Priya", "+14155550142"],
      dress: "Black suit, no sneakers · east lot, B1",
      instructions:
        "Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
      filled: [0, 1, 2, 3, 4],
      jordan: "confirmed",
    },
    {
      key: "harbor",
      venue: "harbor",
      title: "Harbor Pavilion · Wedding",
      start: day(1, 16),
      end: day(1, 23, 30),
      crew: 8,
      contact: ["Report to Marco, events lead", "Marco", "+14155550199"],
      dress: "Black suit, white shirt, no sneakers · Lot C",
      instructions:
        "Black suit, white shirt, no sneakers. Park personal cars in Lot C (north side). Key box is at the valet podium; sign keys out with Marco. Guest arrival peaks 4:30–5:30 PM.",
      filled: [0, 1, 2, 3, 4, 5, 6],
      jordan: "confirmed",
    },
    {
      key: "osteria",
      venue: "osteria",
      title: "Osteria Nove",
      start: day(4, 17, 30),
      end: day(4, 22, 30),
      crew: 4,
      contact: ["Ask for Elena, host stand", "Elena", "+14155550177"],
      dress: "Black shirt and slacks",
      instructions: "Street valet on Valencia. Keys stay at the stand.",
      filled: [0, 5, 7],
      jordan: "confirmed",
    },
    {
      key: "halloween",
      venue: "maison",
      title: "Maison Blanc · Halloween",
      start: day(8, 19),
      end: day(9, 1),
      crew: 8,
      contact: ["Ask for Camille, front of house", "Camille", "+14155550163"],
      dress: "Black suit required, costumes optional",
      instructions: "Costumes optional, black suit required. Use the Fillmore St entrance.",
      filled: [2, 3, 4],
      jordan: "claimed",
    },
    {
      key: "laurel",
      venue: "laurel",
      title: "The Laurel Club",
      start: laurelStart,
      end: new Date(laurelStart.getTime() + 5.5 * HOUR),
      crew: 4,
      contact: ["Ask for Dani, door", "Dani", "+14155550155"],
      dress: "Black suit",
      instructions: "Club entrance on Laurel Ave.",
      filled: [5, 6],
    },
    {
      key: "brunch",
      venue: "harbor",
      title: "Harbor Pavilion · Brunch",
      start: day(2, 10),
      end: day(2, 15),
      crew: 6,
      contact: ["Report to Marco, events lead", "Marco", "+14155550199"],
      dress: "Black suit, no sneakers",
      instructions: "Lot C, north side.",
      filled: [0, 1, 7],
    },
    {
      key: "grand-wed",
      venue: "grand",
      title: "The Grand Hotel",
      start: day(5, 17),
      end: day(5, 22),
      crew: 4,
      contact: ["Ask for Priya, front desk", "Priya", "+14155550142"],
      dress: "Black suit, no sneakers · east lot, B1",
      instructions: "East lot, level B1.",
      filled: [2, 4, 6],
    },
    {
      key: "maison-past",
      venue: "maison",
      title: "Maison Blanc",
      start: day(-1, 18),
      end: day(-1, 23),
      crew: 4,
      contact: ["Ask for Camille, front of house", "Camille", "+14155550163"],
      dress: "Black suit",
      instructions: "",
      filled: [0, 1, 2],
      jordan: "confirmed",
      past: { clockIn: day(-1, 17, 52), clockOut: day(-1, 23, 4), approved: true },
    },
    {
      key: "osteria-past",
      venue: "osteria",
      title: "Osteria Nove",
      start: day(-3, 18),
      end: day(-3, 22, 30),
      crew: 3,
      contact: ["Ask for Elena, host stand", "Elena", "+14155550177"],
      dress: "Black shirt and slacks",
      instructions: "",
      filled: [0, 5],
      jordan: "confirmed",
      past: { clockIn: day(-3, 17, 41), clockOut: day(-3, 22, 33), approved: false },
    },
    {
      key: "westfield-past",
      venue: "westfield",
      title: "Westfield Gala",
      start: day(-6, 19, 30),
      end: day(-5, 0),
      crew: 5,
      contact: ["Ask for Ines, events desk", "Ines", "+14155550188"],
      dress: "Black suit",
      instructions: "",
      filled: [1, 2, 3, 4],
      jordan: "confirmed",
      past: { clockIn: day(-6, 19, 48), clockOut: day(-5, 0, 6), approved: true },
    },
  ]

  // People keep their ids across resets, so a browser's session survives reseeding the demo.
  const stableId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
  const tenantId = stableId(1)
  const jordanId = stableId(100)
  const crewIds = CREW.map((_, i) => stableId(101 + i))
  const venueIds = Object.fromEntries(
    (Object.keys(VENUES) as VenueKey[]).map((key) => [key, randomUUID()]),
  ) as Record<VenueKey, string>
  const eventIds = Object.fromEntries(specs.map((spec) => [spec.key, randomUUID()]))

  const staffRow = (id: string, name: string, email: string, phone: string) => ({
    id,
    tenant_id: tenantId,
    name,
    email,
    phone,
    role_label: "Valet attendant",
    active: true,
    push_enabled: true,
    location_enabled: true,
    camera_enabled: true,
    installed: true,
    notify_open: true,
    notify_remind: true,
    notify_msg: true,
    onboarded_at: iso(now),
    created_at: iso(now),
  })

  const assignments: Record<string, unknown>[] = []
  const punches: Record<string, unknown>[] = []
  const jordanAssignment: Record<string, string> = {}

  const slot = (spec: EventSpec, staffId: string | null, status: string) => {
    const id = randomUUID()
    const past = staffId === jordanId ? spec.past : undefined
    assignments.push({
      id,
      event_id: eventIds[spec.key],
      staff_id: staffId,
      status: past ? "completed" : status,
      claimed_at: status === "claimed" ? iso(minutesAgo(180)) : null,
      clocked_in_at: past ? iso(past.clockIn) : null,
      clocked_out_at: past ? iso(past.clockOut) : null,
      hours_status: past?.approved ? "approved" : "in_review",
      created_at: iso(now),
    })
    return id
  }

  const punch = (assignmentId: string, kind: "in" | "out", at: Date, distance: number) => ({
    id: randomUUID(),
    assignment_id: assignmentId,
    staff_id: jordanId,
    kind,
    idempotency_key: randomUUID(),
    device_at: iso(at),
    server_at: iso(at),
    lat: null,
    lng: null,
    accuracy_m: 18,
    distance_m: distance,
    geofence: "inside",
    selfie: kind === "in",
    offline: false,
    status: "accepted",
    note: null,
    decided_at: null,
    flagged: false,
    flag_reason: null,
  })

  for (const spec of specs) {
    if (spec.jordan) {
      const id = slot(spec, jordanId, spec.jordan)
      jordanAssignment[spec.key] = id
      if (spec.past) {
        punches.push(
          punch(id, "in", spec.past.clockIn, 38),
          punch(id, "out", spec.past.clockOut, 41),
        )
      }
    }
    for (const index of spec.filled) slot(spec, crewIds[index], "confirmed")
    const held = (spec.jordan ? 1 : 0) + spec.filled.length
    for (let n = held; n < spec.crew; n++) slot(spec, null, "open")
  }

  if (scenario === "onshift") {
    const clockIn = new Date(tonightStart.getTime() - 9 * MIN)
    const id = jordanAssignment.tonight
    const row = assignments.find((a) => a.id === id)
    if (row) row.clocked_in_at = iso(clockIn)
    punches.push(punch(id, "in", clockIn, 38))
  }

  const halloween = specs.find((spec) => spec.key === "halloween")
  const osteria = specs.find((spec) => spec.key === "osteria")
  const message = (
    sender: string,
    name: string | null,
    body: string,
    at: Date,
    extra: Record<string, unknown> = {},
  ) => ({
    id: randomUUID(),
    tenant_id: tenantId,
    staff_id: jordanId,
    sender,
    sender_name: name,
    body,
    ref_label: null,
    image_label: null,
    event_id: null,
    created_at: iso(at),
    delivered_at: iso(at),
    read_at: sender === "staff" ? iso(at) : null,
    ...extra,
  })
  const tonightWeekday = formatWeekday(tonightStart, TZ)
  const note = (
    icon: string,
    tone: string,
    title: string,
    body: string,
    href: string,
    at: Date,
    read: boolean,
  ) => ({
    id: randomUUID(),
    staff_id: jordanId,
    dedupe_key: null,
    icon,
    tone,
    title,
    body,
    href,
    created_at: iso(at),
    read_at: read ? iso(at) : null,
  })

  const alexAt = minutesAgo(13)
  const broadcastAt = minutesAgo(170)

  return {
    tenants: [
      {
        id: tenantId,
        name: "Regency Valet Parking",
        accent: "#C9A24A",
        created_at: iso(now),
        timezone: TZ,
      },
    ],
    staff: [
      staffRow(jordanId, "Jordan Ellis", "jordan.ellis@gmail.com", "(415) 555-0123"),
      ...CREW.map(([name, email], i) => staffRow(crewIds[i], name, email, "")),
    ],
    venues: (Object.keys(VENUES) as VenueKey[]).map((key) => {
      const v = VENUES[key]
      return {
        id: venueIds[key],
        tenant_id: tenantId,
        name: v.name,
        address: v.address,
        short_address: v.address.split(",")[0],
        lat: v.lat,
        lng: v.lng,
        radius_m: v.radius,
        min_accuracy_m: 75,
        timezone: TZ,
        maps_url: `https://maps.google.com/?q=${v.address.replace(/[ ,]+/g, "+")}${v.address.includes("San Francisco") ? "" : "+San+Francisco"}`,
      }
    }),
    events: specs.map((spec) => ({
      id: eventIds[spec.key],
      tenant_id: tenantId,
      venue_id: venueIds[spec.venue],
      title: spec.title,
      starts_at: iso(spec.start),
      ends_at: iso(spec.end),
      crew_size: spec.crew,
      clock_in_window_min: 15,
      contact_text: spec.contact[0],
      contact_name: spec.contact[1],
      contact_tel: spec.contact[2],
      dress_code: spec.dress,
      instructions: spec.instructions,
      status: "published",
      created_at: iso(now),
    })),
    assignments,
    punches,
    messages: [
      message(
        "dispatch",
        "Jamie · Dispatch",
        "Hi Jordan, Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
        minutesAgo(220),
        { ref_label: `re: The Grand Hotel · ${tonightWeekday}` },
      ),
      message("staff", "Jordan Ellis", "Got it, thanks! See you there.", minutesAgo(216)),
      message(
        "broadcast",
        "Announcement to all staff",
        "Halloween at Maison Blanc needs 4 more attendants. Costumes optional, black suit required.",
        broadcastAt,
        { event_id: eventIds.halloween },
      ),
      message(
        "dispatch",
        "Alex · Dispatch",
        "Use the side entrance on Mission St. Front drive is blocked until 6:30.",
        alexAt,
        { image_label: "PHOTO · PARKING MAP" },
      ),
    ],
    notifications:
      halloween && osteria
        ? [
            note(
              "chat_bubble",
              "info",
              "New message from Alex",
              "Use the side entrance on Mission St…",
              "/staff/inbox",
              alexAt,
              false,
            ),
            note(
              "add_circle",
              "ok",
              "New open shift · 4 spots",
              `${halloween.title}, ${formatDate(halloween.start, TZ)}, ${formatCompactRange(halloween.start, halloween.end, TZ)}`,
              "/staff/open",
              broadcastAt,
              false,
            ),
            note(
              "edit_calendar",
              "warn",
              "Schedule change",
              `${osteria.title} on ${formatDate(osteria.start, TZ)} now starts 5:30 PM (was 6:00 PM).`,
              `/staff/shifts/detail?id=${jordanAssignment.osteria}`,
              minutesAgo(30 * 60),
              true,
            ),
            note(
              "check_circle",
              "ok",
              "Hours approved",
              "Maison Blanc, 5h 12m",
              "/staff/shifts",
              minutesAgo(26 * 60),
              true,
            ),
            note(
              "event_available",
              "info",
              "You were assigned",
              "Harbor Pavilion · Wedding",
              `/staff/shifts/detail?id=${jordanAssignment.harbor}`,
              minutesAgo(50 * 60),
              true,
            ),
          ]
        : [],
  }
}

export type Fixtures = ReturnType<typeof buildFixtures>
