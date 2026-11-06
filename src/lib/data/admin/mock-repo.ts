// In-memory AdminRepo over the design's fixtures: what the static (fixture-only) build runs on. It
// mirrors the server's rules closely enough for the same screens: actions change state in memory
// and reset on reload.
import { ApiError } from "@/lib/data/api-client"
import { reliability } from "@/lib/insights/valet-stats"
import { deriveBoard, first, type Pulse } from "@/lib/live/model"
import { eventPayState, paySheet, taxCents, type PayInput } from "@/lib/pay/pay-sheet"
import { ADMIN_STATUS } from "@/lib/status/admin"
import {
  ADJUSTED,
  ADMIN_NOTIFICATIONS,
  ADMIN_USER,
  AUDIENCES,
  AVAILABLE_STAFF,
  CLEAN_ENTRIES,
  EVENT_DAYS,
  EVENT_DETAIL,
  HOURS_ENTRIES,
  INVOICES,
  INVOICE_DETAIL,
  PERSON,
  STAFF_ROWS,
  THREADS,
  THREAD_MESSAGES,
  VENUES,
  VENUE_DETAIL,
} from "@/mocks/admin"
import { LIVE_EVENTS, TIMELINE } from "@/mocks/admin-live"

import type { Notifications } from "../staff/schemas"
import type { AdminRepo } from "./repo"
import type { EventPay, Live, LiveEvent, ThreadMessage } from "./ops-schemas"
import type {
  EventCard,
  EventDetail,
  EventList,
  EventTab,
  Settings,
  StaffNote,
  StaffRow,
  VenueDetail,
} from "./schemas"

const wait = <T>(value: T): Promise<T> => Promise.resolve(structuredClone(value))
const cents = (text: string) => Number(text.replace(/[^0-9]/g, ""))

const settings: Settings = {
  company: ADMIN_USER.company,
  accent: "#C9A24A",
  rules: { windowMin: 15, radiusM: 150, accuracyM: 75, selfie: true, earlyOut: true },
  billing: { payRateCents: 2100, salesTaxBp: 625 },
}

/** Each event's pay sheet: the design's crew, 6:00 – 11:00 PM, one still in review. */
const payStore = new Map<string, { rateCents: number; shifts: PayInput[] }>()

function payState(eventId: string) {
  let state = payStore.get(eventId)
  if (!state) {
    state = {
      rateCents: settings.billing.payRateCents,
      shifts: STAFF_ROWS.slice(0, 6).map((row, i) => ({
        assignmentId: `pay-${i}`,
        staffId: row.email,
        name: row.name,
        clockedInAt: new Date("2026-10-24T01:00:00Z"),
        clockedOutAt: new Date(Date.UTC(2026, 9, 24, 6, -i * 5)),
        approved: i !== 5,
        paidCents: null,
        tips: i % 2 === 0,
      })),
    }
    payStore.set(eventId, state)
  }
  return state
}

function payView(eventId: string): EventPay {
  const state = payState(eventId)
  const sheet = paySheet(state.shifts, state.rateCents)
  const tax = taxCents(sheet.totals.amountCents, settings.billing.salesTaxBp)
  return structuredClone({
    eventId,
    venue: EVENT_DETAIL.venue,
    name: "Corporate dinner",
    date: EVENT_DETAIL.when,
    start: "6:00 PM",
    end: "11:00 PM",
    address: "400 Market St",
    rateCents: state.rateCents,
    taxBp: settings.billing.salesTaxBp,
    rows: sheet.rows,
    totals: { ...sheet.totals, taxCents: tax, afterTaxCents: sheet.totals.amountCents + tax },
  })
}

const PAY_LIST_STATUS = {
  in_review: ADMIN_STATUS.payInReview,
  pending: ADMIN_STATUS.payPending,
  on_shift: ADMIN_STATUS.onShift,
  paid: ADMIN_STATUS.paid,
} as const

/** Every venue, seeded from the design and growing as venues are added or edited. */
const venueStore = new Map<string, VenueDetail>(
  VENUES.map((venue) => [
    venue.id,
    {
      id: venue.id,
      name: venue.name,
      address: venue.id === "grand" ? VENUE_DETAIL.address : `${venue.address} · CT`,
      street: venue.address,
      lat: 37.7936,
      lng: -122.3965,
      radiusM: venue.radius,
      contact: VENUE_DETAIL.rows[0].v,
      contactName: "Priya",
      contactTel: "(415) 555-0100",
      dress: VENUE_DETAIL.rows[1].v,
      billingEmail: "billing@example.com",
      billRateCents: 3800,
    },
  ]),
)
let instructions: string = EVENT_DETAIL.instructions
let liveEvents: LiveEvent[] = structuredClone(LIVE_EVENTS)

/** The demo has no history: yesterday is today's counts less a fixed example change. */
const DEMO_CHANGE: Pulse = { need: 2, live: 1, onShift: 2, expected: -1, open: 0 }
const demoYesterday = (now: Pulse): Pulse => ({
  need: Math.max(0, now.need - DEMO_CHANGE.need),
  live: Math.max(0, now.live - DEMO_CHANGE.live),
  onShift: Math.max(0, now.onShift - DEMO_CHANGE.onShift),
  expected: Math.max(0, now.expected - DEMO_CHANGE.expected),
  open: Math.max(0, now.open - DEMO_CHANGE.open),
})
const approvedHours = new Set<string>()
let cleanApproved = false
const staffRows: StaffRow[] = STAFF_ROWS.map((row) => ({
  id: row.email,
  initials: row.initials,
  name: row.name,
  email: row.email,
  status: row.status,
  bucket: row.bucket,
  next: row.next,
  hours: row.hours,
}))
let sentInvoice = false
let unreadNotices = 2
let threadMessages: ThreadMessage[] = THREAD_MESSAGES.map((m, i) => ({ id: `m${i}`, ...m }))
/** Conversations started from the inbox's "New message" picker, keyed by staff id. */
const newThreadMessages = new Map<string, ThreadMessage[]>()
let staffNotes: StaffNote[] = [
  {
    id: "n1",
    body: "Great with VIP guests at the Grand. Prefers evening shifts.",
    author: ADMIN_USER.name,
    when: "Oct 12 · 4:10 PM",
  },
]

const eventCards: EventCard[] = EVENT_DAYS.flatMap((day) => day.items)

function eventList(tab: EventTab): EventList {
  const keep = (e: EventCard) =>
    tab === "live"
      ? e.state === "live"
      : tab === "short"
        ? e.state === "short"
        : tab === "draft"
          ? e.state === "draft"
          : tab !== "past"
  return {
    days: EVENT_DAYS.map((day) => ({ label: day.label, items: day.items.filter(keep) })).filter(
      (day) => day.items.length > 0,
    ),
    upcoming: eventCards.length,
    live: eventCards.filter((e) => e.state === "live").length,
    short: eventCards.filter((e) => e.state === "short").length,
    drafts: eventCards.filter((e) => e.state === "draft").length,
  }
}

function eventDetail(): EventDetail {
  return {
    id: "grand",
    venue: EVENT_DETAIL.venue,
    venueId: "grand",
    badge: { label: `Live now · ${EVENT_DETAIL.when}`, live: true },
    summary: EVENT_DETAIL.summary,
    instructions,
    stats: EVENT_DETAIL.stats.map((s) => ({ ...s })),
    roster: EVENT_DETAIL.roster.map((r) => ({
      id: r.name,
      initials: r.initials,
      name: r.name,
      detail: r.detail,
      status: r.status,
      action: "action" in r ? r.action : undefined,
    })),
    openSlots: [...EVENT_DETAIL.openSlots],
    confirmedCount: 6,
    cancelled: false,
    editable: {
      date: "2026-11-07",
      start: "18:00",
      end: "23:00",
      name: "Wedding",
    },
  }
}

function venueDetail(id: string | undefined): VenueDetail {
  const venue = (id ? venueStore.get(id) : undefined) ?? [...venueStore.values()][0]
  return structuredClone(venue)
}

function mapSlots(eventId: string, change: (slots: LiveEvent["slots"]) => LiveEvent["slots"]) {
  liveEvents = liveEvents.map((e) => (e.id === eventId ? { ...e, slots: change(e.slots) } : e))
}
const eventOfSlot = (slotId: string) => liveEvents.find((e) => e.slots.some((s) => s.id === slotId))

export const mockAdminRepo: AdminRepo = {
  session: async () => {
    const live = deriveBoard(liveEvents, {}).attention.length
    return structuredClone({
      admin: ADMIN_USER,
      badges: {
        live,
        hours: HOURS_ENTRIES.filter((e) => !approvedHours.has(e.id)).length,
        inbox: THREADS.filter((t) => t.unread).length,
      },
      accent: settings.accent,
    })
  },

  settings: () => wait(settings),
  updateSettings: async (patch) => {
    if (patch.accent) settings.accent = patch.accent
    Object.assign(settings.rules, patch.rules)
    Object.assign(settings.billing, patch.billing)
    return structuredClone(settings)
  },

  venues: () =>
    wait(
      [...venueStore.values()].map((v) => ({
        id: v.id,
        name: v.name,
        address: v.street.split(",")[0] ?? v.street,
        radiusM: v.radiusM,
        upcoming: VENUES.find((seed) => seed.id === v.id)?.upcoming ?? "No upcoming",
      })),
    ),
  venue: async (id) => venueDetail(id),
  createVenue: async (request) => {
    const id = `venue-${venueStore.size + 1}`
    venueStore.set(id, {
      ...request,
      id,
      address: `${request.street} · CT`,
      contact: request.contactName,
    })
    return venueDetail(id)
  },
  updateVenue: async (id, patch) => {
    const current = venueDetail(id)
    const next = { ...current, ...patch }
    venueStore.set(current.id, {
      ...next,
      address: `${next.street} · CT`,
      contact: next.contactName,
    })
    return venueDetail(id)
  },
  deleteVenue: async (id) => {
    venueStore.delete(id)
  },

  staff: () =>
    wait({
      rows: staffRows,
      total: staffRows.filter((r) => r.bucket !== "inactive").length,
      invited: staffRows.filter((r) => r.bucket === "invited").length,
      alertsOff: staffRows.filter((r) => r.bucket === "alerts").length,
    }),
  person: async () =>
    structuredClone({
      id: "jordan",
      initials: PERSON.initials,
      name: PERSON.name,
      role: PERSON.role,
      phone: PERSON.phone,
      active: true,
      rows: PERSON.rows.map((r) => ({ ...r })),
      shifts: PERSON.shifts.map((s) => ({ ...s })),
    }),
  invite: async (emails) => {
    for (const email of emails) {
      const name = email.split("@")[0].replace(/[._]/g, " ")
      staffRows.push({
        id: email,
        initials: name.slice(0, 2).toUpperCase(),
        name,
        email,
        status: ADMIN_STATUS.invited,
        bucket: "invited",
        next: "Not joined yet",
        hours: "—",
      })
    }
    return { invited: emails.length, skipped: [] }
  },
  personInsights: async (_id, days) => {
    const scale = days / 90
    const counts = {
      onTime: Math.round(11 * scale),
      late: Math.round(2 * scale),
      noShows: days >= 90 ? 1 : 0,
      drops: Math.round(scale),
      lateDrops: 0,
    }
    return structuredClone({
      rangeDays: days,
      score: reliability(counts),
      stats: {
        ...counts,
        shifts: counts.onTime + counts.late,
        minutes: (counts.onTime + counts.late) * 290,
        avgLateMin: counts.late ? 9 : null,
        removed: 0,
        claimed: Math.round(8 * scale),
        assigned: Math.round(5 * scale),
        outsideFence: 1,
        flagged: 0,
        adjustments: 1,
        tipsShifts: Math.round(6 * scale),
        earnedCents: (counts.onTime + counts.late) * 10_150,
        paidCents: (counts.onTime + counts.late - 2) * 10_150,
        pendingCents: 20_300,
      },
      upcoming: [{ event: "The Grand Hotel · Corporate dinner", when: "Fri Oct 30 · 6:00 PM" }],
      months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month, i) => ({
        label: `${month} 2026`,
        shifts: [3, 4, 2, 5, 4, 6][i] ?? 0,
        minutes: ([3, 4, 2, 5, 4, 6][i] ?? 0) * 290,
        late: i === 4 ? 1 : 0,
        noShows: i === 2 ? 1 : 0,
      })),
      venues: [
        { venue: "The Grand Hotel", shifts: 7, minutes: 2030 },
        { venue: "Harbor Pavilion", shifts: 4, minutes: 1160 },
      ],
      activity: [
        {
          id: "m1",
          when: "Fri Oct 23 · 5:51 PM",
          kind: "clock_in" as const,
          title: "Clocked in · The Grand Hotel · Corporate dinner",
          detail: "On time · Inside the fence",
          issue: false,
        },
        {
          id: "m2",
          when: "Wed Oct 21 · 9:02 AM",
          kind: "claimed" as const,
          title: "Claimed The Grand Hotel · Corporate dinner",
          detail: "For Fri Oct 23 · 6:00 PM",
          issue: false,
        },
        {
          id: "m3",
          when: "Sat Oct 17 · 6:14 PM",
          kind: "clock_in" as const,
          title: "Clocked in · Harbor Pavilion · Wedding",
          detail: "14 min late · 212 m outside the fence · Approved by an admin",
          issue: true,
        },
      ],
      notes: staffNotes,
    })
  },
  addStaffNote: async (_id, body) => {
    staffNotes.unshift({
      id: `n${staffNotes.length + 1}`,
      body,
      author: ADMIN_USER.name,
      when: "Just now",
    })
    return structuredClone(staffNotes)
  },
  deleteStaffNote: async (_id, noteId) => {
    staffNotes = staffNotes.filter((note) => note.id !== noteId)
    return structuredClone(staffNotes)
  },
  deactivate: async () => {},
  deleteStaff: async () => {},

  events: (tab) => wait(eventList(tab)),
  event: async () => eventDetail(),
  createEvent: async () => ({ id: "new-event" }),
  updateEvent: async (_id, patch) => {
    if (patch.instructions !== undefined) instructions = patch.instructions
    return eventDetail()
  },
  cancelEvent: async () => {},
  availableForWindow: () =>
    wait(
      AVAILABLE_STAFF.map((p) => ({
        id: p.initials,
        initials: p.initials,
        name: p.name,
        note: p.note,
      })),
    ),
  availableStaff: () =>
    wait(
      AVAILABLE_STAFF.map((p) => ({
        id: p.initials,
        initials: p.initials,
        name: p.name,
        note: p.note,
      })),
    ),
  assign: async (_eventId, staffIds) => ({
    assigned: staffIds?.length ?? 1,
    names: (staffIds ?? ["KM"]).map(
      (id) => AVAILABLE_STAFF.find((p) => p.initials === id)?.name ?? "Kai Morgan",
    ),
  }),
  addSlot: async (eventId) => {
    mapSlots(eventId, (slots) => [
      ...slots,
      {
        id: `slot-new-${slots.length}`,
        staffId: null,
        name: "Open slot",
        state: "open",
        meta: "Added by you",
        facts: {},
      },
    ])
    return { headcount: liveEvents.find((e) => e.id === eventId)?.slots.length ?? 0 }
  },
  broadcastOpen: async () => ({ recipients: 31 }),
  eventPay: async (eventId) => payView(eventId),
  setEventPayRate: async (eventId, rateCents) => {
    payState(eventId).rateCents = rateCents
    return payView(eventId)
  },
  markEventPay: async (eventId, assignmentId, patch) => {
    const state = payState(eventId)
    const shift = state.shifts.find((candidate) => candidate.assignmentId === assignmentId)
    const row = payView(eventId).rows.find((candidate) => candidate.assignmentId === assignmentId)
    if (!shift || !row) throw new ApiError(404, "not_found", "That valet isn't on this pay sheet.")
    if (patch.paid === true && row.state === "in_review") {
      throw new ApiError(409, "hours_in_review", `Approve ${row.name}'s hours first.`)
    }
    if (patch.paid === true && row.state === "pending") shift.paidCents = row.amountCents
    if (patch.paid === false) shift.paidCents = null
    if (patch.tips !== undefined) shift.tips = patch.tips
    return payView(eventId)
  },
  markAllEventPaid: async (eventId) => {
    const state = payState(eventId)
    for (const row of payView(eventId).rows.filter((candidate) => candidate.state === "pending")) {
      const shift = state.shifts.find((candidate) => candidate.assignmentId === row.assignmentId)
      if (shift) shift.paidCents = row.amountCents
    }
    return payView(eventId)
  },
  sendEventPay: async (eventId, staffId) => ({
    sent: payView(eventId).rows.filter(
      (row) => row.state !== "on_shift" && (staffId === undefined || row.staffId === staffId),
    ).length,
  }),

  live: async (): Promise<Live> =>
    structuredClone({
      events: liveEvents,
      timeline: { ...TIMELINE, ticks: [...TIMELINE.ticks] },
      zone: "CT",
      serverNow: new Date().toISOString(),
      yesterday: demoYesterday(deriveBoard(liveEvents, {}).pulse),
    }),
  decide: async (punchId, decision) => {
    const event = liveEvents.find((e) => e.slots.some((s) => s.facts.punchId === punchId))
    const target = event?.slots.find((s) => s.facts.punchId === punchId)
    if (event && target) {
      mapSlots(event.id, (slots) =>
        slots.map((s) =>
          s.id === target.id
            ? decision === "approve"
              ? {
                  ...s,
                  state: "override",
                  meta: "Approved override · in 5:58 PM (request time) · by you",
                  facts: {},
                }
              : { ...s, state: "due", meta: "Override rejected", facts: {} }
            : s,
        ),
      )
    }
    return { name: target?.name ?? "", atLabel: "5:58 PM" }
  },
  nudge: async (slotId) => {
    const event = eventOfSlot(slotId)
    const target = event?.slots.find((s) => s.id === slotId)
    if (event)
      mapSlots(event.id, (slots) =>
        slots.map((s) =>
          s.id === slotId ? { ...s, facts: { ...s.facts, nudgedAt: "6:04 PM" } } : s,
        ),
      )
    return { name: target?.name ?? "" }
  },
  removeFromSlot: async (slotId) => {
    const event = eventOfSlot(slotId)
    const target = event?.slots.find((s) => s.id === slotId)
    if (event) {
      mapSlots(event.id, (slots) =>
        slots.map((s) =>
          s.id === slotId
            ? {
                ...s,
                staffId: null,
                name: "Open slot",
                state: "open",
                meta: `Removed ${first(target?.name ?? "")}`,
                facts: {},
              }
            : s,
        ),
      )
    }
    return { name: target?.name ?? "" }
  },

  hours: async () => {
    const entry = (e: (typeof HOURS_ENTRIES)[number], approved: boolean) => ({
      id: e.id,
      initials: e.initials,
      name: e.name,
      venue: e.venue,
      inTime: e.inTime,
      outTime: e.outTime,
      total: e.total,
      flag: e.flag,
      outFlagged: Boolean(e.outFlagged),
      approved,
    })
    return structuredClone({
      period: "Pay period Oct 19 – 25 · locks Mon 9 AM",
      cleanCount: cleanApproved ? 0 : CLEAN_ENTRIES,
      review: HOURS_ENTRIES.filter((e) => !approvedHours.has(e.id)).map((e) => entry(e, false)),
      approved: HOURS_ENTRIES.filter((e) => approvedHours.has(e.id)).map((e) => entry(e, true)),
    })
  },
  approveHours: async (id) => {
    approvedHours.add(id)
  },
  approveClean: async () => {
    cleanApproved = true
    return CLEAN_ENTRIES
  },
  adjustHours: async (id) => {
    approvedHours.add(id)
    return {
      outTime: ADJUSTED.outTime,
      total: ADJUSTED.total,
      name: HOURS_ENTRIES.find((e) => e.id === id)?.name ?? "",
    }
  },

  invoices: () =>
    wait(
      INVOICES.map((invoice, i) => ({
        id: `inv-${i}`,
        venue: invoice.venue,
        period: invoice.period,
        status: invoice.status,
        hours: invoice.hours,
        amountCents: cents(invoice.amount),
      })),
    ),
  invoice: async () =>
    structuredClone({
      id: "inv-0",
      number: INVOICE_DETAIL.number,
      venue: INVOICE_DETAIL.venue,
      period: INVOICE_DETAIL.period,
      subtotalCents: cents(INVOICE_DETAIL.total),
      taxBp: settings.billing.salesTaxBp,
      taxCents: taxCents(cents(INVOICE_DETAIL.total), settings.billing.salesTaxBp),
      totalCents:
        cents(INVOICE_DETAIL.total) +
        taxCents(cents(INVOICE_DETAIL.total), settings.billing.salesTaxBp),
      notice: INVOICE_DETAIL.notice,
      billedTo: INVOICE_DETAIL.sentTo,
      sent: sentInvoice,
      lines: [
        {
          what: INVOICE_DETAIL.lines[0].what,
          staffCount: 8,
          minutes: 3510,
          rateCents: 3800,
          amountCents: 222300,
        },
        {
          what: INVOICE_DETAIL.lines[1].what,
          staffCount: 5,
          minutes: 1470,
          rateCents: 3800,
          amountCents: 93100,
        },
        {
          what: INVOICE_DETAIL.lines[2].what,
          staffCount: 7,
          minutes: 3360,
          rateCents: 3800,
          amountCents: 212800,
        },
      ],
    }),
  createInvoice: async () => ({ id: "inv-0" }),
  payrollEvents: async () => {
    const sheet = payView("evt-grand")
    return [
      {
        eventId: sheet.eventId,
        venue: sheet.venue,
        name: sheet.name,
        date: sheet.date,
        time: `${sheet.start} – ${sheet.end}`,
        valets: sheet.totals.valets,
        minutes: sheet.totals.minutes,
        amountCents: sheet.totals.amountCents,
        pendingCents: sheet.totals.pendingCents,
        status: PAY_LIST_STATUS[eventPayState(sheet.rows)],
      },
    ]
  },
  sendInvoice: async () => {
    sentInvoice = true
    return { billedTo: INVOICE_DETAIL.sentTo }
  },
  payroll: async () => ({
    period: "Oct 16 – 31",
    rows: [
      {
        staffId: "s1",
        initials: "AR",
        name: "Ana Ruiz",
        email: "ana.ruiz@example.com",
        shifts: 3,
        hours: "14.5",
        amountCents: 82650,
        pendingCents: 54150,
        lines: [
          { event: "Grand Gala", date: "Oct 17", hours: "5.0", amountCents: 28500, paid: true },
          {
            event: "Corporate Dinner",
            date: "Oct 21",
            hours: "4.5",
            amountCents: 25650,
            paid: false,
          },
          {
            event: "Wedding Reception",
            date: "Oct 28",
            hours: "5.0",
            amountCents: 28500,
            paid: false,
          },
        ],
      },
      {
        staffId: "s2",
        initials: "CB",
        name: "Cole Bennett",
        email: "cole.bennett@example.com",
        shifts: 2,
        hours: "9.8",
        amountCents: 55860,
        pendingCents: 55860,
        lines: [
          { event: "Grand Gala", date: "Oct 17", hours: "5.0", amountCents: 28500, paid: false },
          {
            event: "Corporate Dinner",
            date: "Oct 21",
            hours: "4.8",
            amountCents: 27360,
            paid: false,
          },
        ],
      },
    ],
    totalCents: 138510,
  }),
  sendPayroll: async () => ({ sent: 2 }),
  sendPayrollTo: async () => ({ sent: 1 }),

  inbox: () =>
    wait({
      threads: THREADS.map((t, i) => ({
        id: `t${i}`,
        initials: t.initials,
        name: t.name,
        last: t.last,
        time: t.time,
        unread: Boolean("unread" in t && t.unread),
        announcement: Boolean("announcement" in t && t.announcement),
      })),
      unread: THREADS.filter((t) => "unread" in t && t.unread).length,
    }),
  thread: async (id) => {
    const person = id ? staffRows.find((r) => r.id === id) : undefined
    if (person) {
      return structuredClone({
        id: person.id,
        name: person.name,
        initials: person.initials,
        subtitle: "Valet attendant",
        announcement: false,
        canReply: true,
        messages: newThreadMessages.get(person.id) ?? [],
      })
    }
    const index = Number(id?.replace("t", "")) || 0
    const t = THREADS[index] ?? THREADS[0]
    return structuredClone({
      id: id ?? "t0",
      name: t.name,
      initials: t.initials,
      subtitle: index === 0 ? "On site · The Grand Hotel" : "Valet attendant",
      announcement: Boolean("announcement" in t && t.announcement),
      canReply: !("announcement" in t && t.announcement),
      messages: threadMessages,
    })
  },
  reply: async (id, text) => {
    const message = { id: `m${Date.now()}`, text, meta: "Just now · Jamie", mine: true }
    const person = id ? staffRows.find((r) => r.id === id) : undefined
    if (person) {
      newThreadMessages.set(person.id, [...(newThreadMessages.get(person.id) ?? []), message])
    } else {
      threadMessages = [...threadMessages, message]
    }
    return structuredClone(message)
  },
  notifications: async (): Promise<Notifications> => ({
    groups: [
      {
        label: "TODAY",
        items: ADMIN_NOTIFICATIONS.map((item, i) => ({ ...item, unread: i < unreadNotices })),
      },
    ],
    unread: unreadNotices,
  }),
  markNotificationsRead: async () => {
    unreadNotices = 0
  },
  audiences: () => wait(AUDIENCES.map((a) => ({ key: a.key, label: a.label, reach: a.reach }))),
  announce: async () => ({ delivered: 6 }),
}
