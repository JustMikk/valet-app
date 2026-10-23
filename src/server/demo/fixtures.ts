// Demo data for Regency Valet Parking, built relative to "now" so the app always has a live shift
// and a live operation. Illustrative people and venues (cast.ts), events and who is doing what
// (schedule.ts). Pure: rows in, no database, so the invariants are unit-tested.
import { randomUUID } from "node:crypto"

import {
  formatCompactRange,
  formatDate,
  formatWeekday,
  wallTime,
  zonedInstant,
} from "@/lib/time/labels"

import {
  ADMIN_ID,
  ROSTER,
  TENANT_ID,
  TZ,
  VENUES,
  VENUE_KEYS,
  person,
  stableId,
  type VenueKey,
} from "./cast"
import { buildInvoices } from "./invoices"
import { buildSchedule, type Held, type InPunch, type Scenario } from "./schedule"

export type { Scenario } from "./schedule"
export const SCENARIOS: readonly Scenario[] = ["before", "due", "onshift"]

const MIN = 60_000
const DAY = 24 * 60 * MIN
const iso = (date: Date) => date.toISOString()
type Row = Record<string, unknown>

type Options = {
  /** Move The Grand Hotel here (the tonight shift), so a real GPS fix can be inside its fence. */
  grandCenter?: { lat: number; lng: number }
}

export function buildFixtures(now: Date, scenario: Scenario, options: Options = {}) {
  const today = wallTime(now, TZ)
  const ago = (minutes: number) => new Date(now.getTime() - minutes * MIN)
  const specs = buildSchedule(now, scenario)
  const venueIds = Object.fromEntries(
    VENUE_KEYS.map((key, i) => [key, stableId(10 + i)]),
  ) as Record<VenueKey, string>
  const eventIds = Object.fromEntries(specs.map((spec) => [spec.key, randomUUID()]))
  const jordan = person("Jordan Ellis")

  const assignments: Row[] = []
  const punches: Row[] = []
  const drops: Row[] = []
  const jordanAssignment: Record<string, string> = {}

  const punch = (
    assignmentId: string,
    staffId: string,
    kind: "in" | "out",
    at: Date,
    extra: Row,
  ) => ({
    id: randomUUID(),
    assignment_id: assignmentId,
    staff_id: staffId,
    kind,
    idempotency_key: randomUUID(),
    device_at: iso(at),
    server_at: iso(at),
    accuracy_m: 18,
    distance_m: 38,
    geofence: "inside",
    selfie: kind === "in",
    offline: false,
    status: "accepted",
    flagged: false,
    ...extra,
  })

  specs.forEach((spec) => {
    const venue = VENUES[spec.venue]
    const opens = spec.start.getTime() - 15 * MIN
    const windowOpen = now.getTime() >= opens
    const eventId = eventIds[spec.key]

    for (const slot of spec.slots) {
      const id = randomUUID()
      const base = {
        id,
        event_id: eventId,
        staff_id: null as string | null,
        status: "open",
        hours_status: "in_review",
        created_at: iso(ago(DAY / MIN)),
      }

      if ("open" in slot) {
        assignments.push(base)
        if (slot.dropped) {
          drops.push({
            id: randomUUID(),
            assignment_id: id,
            staff_id: person(slot.dropped.by).id,
            reason: "other",
            late: true,
            created_at: iso(new Date(spec.start.getTime() - slot.dropped.minsBeforeStart * MIN)),
          })
        }
        continue
      }

      const who = person(slot.who)
      const row: Row = {
        ...base,
        staff_id: who.id,
        status: slot.claimed ? "claimed" : "confirmed",
        claimed_at: slot.claimed ? iso(ago(180)) : null,
        assigned_at: slot.claimed ? null : iso(ago((3 * DAY) / MIN)),
        assigned_by: slot.claimed ? null : ADMIN_ID,
      }
      assignments.push(row)
      if (who.id === jordan.id) jordanAssignment[spec.key] = id

      const clockIn = (at: Date, p: Omit<InPunch, "at">) => {
        const syncedAt = p.syncedLateMin ? new Date(at.getTime() + p.syncedLateMin * MIN) : at
        row.clocked_in_at = iso(at)
        punches.push(
          punch(id, who.id, "in", at, {
            server_at: iso(syncedAt),
            accuracy_m: p.acc,
            distance_m: p.dist,
            geofence: p.dist <= venue.radius ? "inside" : "outside",
            offline: Boolean(p.syncedLateMin),
            status: p.override ? "approved" : "accepted",
            decided_by: p.override ? ADMIN_ID : null,
            decided_at: p.override ? iso(syncedAt) : null,
            flagged: Boolean(p.override || p.syncedLateMin),
            flag_reason: p.override
              ? "Approved override"
              : p.syncedLateMin
                ? "Queued punch synced late"
                : null,
          }),
        )
      }

      if (slot.scenarioDriven) {
        if (scenario === "onshift")
          clockIn(new Date(spec.start.getTime() - 9 * MIN), { dist: 38, acc: 12 })
      } else if (slot.on && windowOpen) {
        const at = new Date(Math.min(spec.start.getTime() + slot.on.at * MIN, now.getTime() - MIN))
        clockIn(at, slot.on)
      } else if (slot.pending && windowOpen) {
        const requestedAt = ago(slot.pending.waitedMin)
        punches.push(
          punch(id, who.id, "in", requestedAt, {
            accuracy_m: slot.pending.acc,
            distance_m: slot.pending.dist,
            geofence: "outside",
            status: "pending_approval",
            note: slot.pending.note,
          }),
        )
      } else if (slot.worked) {
        const w = slot.worked
        clockIn(new Date(spec.start.getTime() + w.in * MIN), w.inPunch ?? { dist: 30, acc: 10 })
        row.hours_status = w.approved ? "approved" : "in_review"
        if (w.out !== null) {
          const out = new Date(spec.end.getTime() + w.out * MIN)
          row.clocked_out_at = iso(out)
          row.status = "completed"
          punches.push(
            punch(id, who.id, "out", out, { distance_m: 41, note: w.note ?? null, selfie: false }),
          )
        }
      }
    }
  })

  const staff = ROSTER.map((p, i) => ({
    id: p.id,
    tenant_id: TENANT_ID,
    name: p.name,
    email: p.email,
    phone: p.phone,
    role_label: "Valet attendant",
    active: !p.inactive,
    push_enabled: !p.pushOff,
    location_enabled: true,
    camera_enabled: true,
    installed: !p.invited,
    notify_open: true,
    notify_remind: true,
    notify_msg: true,
    onboarded_at: p.invited ? null : iso(ago((60 + i * 4) * (DAY / MIN))),
    invited_at: p.invited ? iso(ago(2 * (DAY / MIN))) : null,
    device_label: p.invited ? null : p.device,
    created_at: iso(ago((60 + i * 4) * (DAY / MIN))),
  }))

  const venues = VENUE_KEYS.map((key) => {
    const v = key === "grand" ? { ...VENUES.grand, ...options.grandCenter } : VENUES[key]
    return {
      id: venueIds[key],
      tenant_id: TENANT_ID,
      name: v.name,
      address: v.address,
      short_address: v.address.split(",")[0],
      lat: v.lat,
      lng: v.lng,
      radius_m: v.radius,
      min_accuracy_m: 75,
      timezone: TZ,
      maps_url: `https://maps.google.com/?q=${v.address.replace(/[ ,]+/g, "+")}${v.address.includes("San Francisco") ? "" : "+San+Francisco"}`,
      bill_rate_cents: v.rateCents,
      contact_text: v.contact,
      contact_name: v.contactName,
      contact_tel: v.contactTel,
      dress_code: v.dress,
      billing_email: v.billing,
    }
  })

  const events = specs.map((spec) => ({
    id: eventIds[spec.key],
    tenant_id: TENANT_ID,
    venue_id: venueIds[spec.venue],
    title: spec.title,
    kind: spec.kind,
    starts_at: iso(spec.start),
    ends_at: iso(spec.end),
    crew_size: spec.slots.length,
    clock_in_window_min: 15,
    contact_text: spec.contact[0],
    contact_name: spec.contact[1],
    contact_tel: spec.contact[2],
    dress_code: spec.dress,
    instructions: spec.instructions,
    status: spec.status,
    posted_at: iso(ago((spec.postedDaysAgo ?? 3) * (DAY / MIN))),
    created_at: iso(ago(5 * (DAY / MIN))),
  }))

  // ── Messages ────────────────────────────────────────────────────────────────────────────
  const messages: Row[] = []
  const message = (
    staffId: string,
    sender: string,
    name: string | null,
    body: string,
    at: Date,
    extra: Row = {},
  ) => {
    const row = {
      id: randomUUID(),
      tenant_id: TENANT_ID,
      staff_id: staffId,
      sender,
      sender_name: name,
      body,
      created_at: iso(at),
      delivered_at: iso(at),
      read_at: sender === "staff" ? iso(at) : null,
      admin_read_at: sender === "staff" ? null : iso(at),
      ...extra,
    }
    messages.push(row)
    return row
  }
  const tonight = specs[0]
  const tonightWeekday = formatWeekday(tonight.start, TZ)
  const JAMIE = { sender_admin_id: ADMIN_ID }

  message(
    jordan.id,
    "dispatch",
    "Jamie · Dispatch",
    "Hi Jordan, Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
    ago(220),
    { ...JAMIE, ref_label: `re: The Grand Hotel · ${tonightWeekday}` },
  )
  message(jordan.id, "staff", jordan.name, "Got it, thanks! See you there.", ago(216), {
    admin_read_at: iso(ago(215)),
  })
  message(
    jordan.id,
    "dispatch",
    "Alex · Dispatch",
    "Use the side entrance on Mission St. Front drive is blocked until 6:30.",
    ago(13),
    { image_label: "PHOTO · PARKING MAP" },
  )
  message(
    person("Maya Patel").id,
    "dispatch",
    "Jamie · Dispatch",
    "Hi Maya, you're on the Grand Hotel crew tonight. East lot, level B1.",
    ago(205),
    JAMIE,
  )
  message(person("Maya Patel").id, "staff", "Maya Patel", "Thanks! See you there", ago(200), {
    admin_read_at: iso(ago(199)),
  })
  message(
    person("Luis Torres").id,
    "staff",
    "Luis Torres",
    "I'm on garage level 3, GPS is off",
    ago(7),
  )
  message(
    person("Dana Ortiz").id,
    "staff",
    "Dana Ortiz",
    "Parked in the garage and can't get a fix",
    ago(9),
  )

  const halloween = specs.find((s) => s.key === "halloween")
  const grandCrew = tonight.slots.filter((s): s is Held => "who" in s).map((s) => person(s.who))
  const everyone = ROSTER.filter((p) => !p.inactive && !p.invited)
  const broadcasts: Row[] = []
  const broadcast = (
    audience: "all" | "event",
    label: string,
    body: string,
    to: typeof everyone,
    at: Date,
    eventKey: string,
  ) => {
    const id = randomUUID()
    broadcasts.push({
      id,
      tenant_id: TENANT_ID,
      admin_id: ADMIN_ID,
      audience,
      audience_label: label,
      event_id: eventIds[eventKey],
      body,
      recipients: to.length,
      created_at: iso(at),
    })
    for (const p of to) {
      message(
        p.id,
        "broadcast",
        audience === "all" ? "Announcement to all staff" : `${label}`,
        body,
        at,
        { broadcast_id: id, event_id: audience === "all" ? eventIds[eventKey] : null, ...JAMIE },
      )
    }
  }
  broadcast(
    "all",
    "All staff",
    "Halloween at Maison Blanc needs 4 more attendants. Costumes optional, black suit required.",
    everyone,
    ago(170),
    "halloween",
  )
  broadcast(
    "event",
    `The Grand Hotel crew · ${grandCrew.length}`,
    "Front drive closed until 6:30",
    grandCrew,
    ago(230),
    "tonight",
  )

  // ── Notifications for the demo worker ───────────────────────────────────────────────────
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
    staff_id: jordan.id,
    icon,
    tone,
    title,
    body,
    href,
    created_at: iso(at),
    read_at: read ? iso(at) : null,
  })
  const osteria = specs.find((s) => s.key === "osteria")
  const notifications =
    halloween && osteria
      ? [
          note(
            "chat_bubble",
            "info",
            "New message from Alex",
            "Use the side entrance on Mission St…",
            "/staff/inbox",
            ago(13),
            false,
          ),
          note(
            "add_circle",
            "ok",
            "New open shift · 4 spots",
            `${halloween.title}, ${formatDate(halloween.start, TZ)}, ${formatCompactRange(halloween.start, halloween.end, TZ)}`,
            "/staff/open",
            ago(170),
            false,
          ),
          note(
            "edit_calendar",
            "warn",
            "Schedule change",
            `${osteria.title} on ${formatDate(osteria.start, TZ)} now starts 5:30 PM (was 6:00 PM).`,
            `/staff/shifts/detail?id=${jordanAssignment.osteria}`,
            ago(30 * 60),
            true,
          ),
          note(
            "check_circle",
            "ok",
            "Hours approved",
            "Maison Blanc, 5h 12m",
            "/staff/shifts",
            ago(26 * 60),
            true,
          ),
          note(
            "event_available",
            "info",
            "You were assigned",
            "Harbor Pavilion · Wedding",
            `/staff/shifts/detail?id=${jordanAssignment.harbor}`,
            ago(50 * 60),
            true,
          ),
        ]
      : []

  const { invoices, invoiceLines } = buildInvoices(now, today, venueIds)

  return {
    tenants: [
      {
        id: TENANT_ID,
        name: "Regency Valet Parking",
        accent: "#C9A24A",
        created_at: iso(now),
        timezone: TZ,
      },
    ],
    admins: [
      {
        id: ADMIN_ID,
        tenant_id: TENANT_ID,
        name: "Jamie Cole",
        email: "jamie.cole@regencyvalet.com",
        role_label: "Owner · Admin",
      },
    ],
    staff,
    venues,
    events,
    assignments,
    punches,
    drops,
    broadcasts,
    messages,
    notifications,
    invoices,
    invoice_lines: invoiceLines,
  }
}

export type Fixtures = ReturnType<typeof buildFixtures>

/** Helper kept for tests: the instant `days` from today at a venue wall time. */
export function dayAt(now: Date, days: number, hour: number, minute = 0): Date {
  const today = wallTime(now, TZ)
  return zonedInstant(TZ, {
    year: today.year,
    month: today.month,
    day: today.day + days,
    hour,
    minute,
  })
}
