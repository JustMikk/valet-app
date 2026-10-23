// In-memory AdminRepo over the design's fixtures: what the static (fixture-only) build runs on. It
// mirrors the server's rules closely enough for the same screens: actions change state in memory
// and reset on reload.
import { deriveBoard, first } from "@/lib/live/model"
import { ADMIN_STATUS } from "@/lib/status/admin"
import {
  ADJUSTED,
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

import type { AdminRepo } from "./repo"
import type { Live, LiveEvent, ThreadMessage } from "./ops-schemas"
import type {
  EventCard,
  EventDetail,
  EventList,
  EventTab,
  Settings,
  StaffRow,
  VenueDetail,
} from "./schemas"

const wait = <T>(value: T): Promise<T> => Promise.resolve(structuredClone(value))
const cents = (text: string) => Number(text.replace(/[^0-9]/g, ""))

const settings: Settings = {
  company: ADMIN_USER.company,
  accent: "#C9A24A",
  rules: { windowMin: 15, radiusM: 150, accuracyM: 75, selfie: true, earlyOut: true },
}

const radii = new Map(VENUES.map((venue) => [venue.id, venue.radius as number]))
let liveEvents: LiveEvent[] = structuredClone(LIVE_EVENTS)
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
let threadMessages: ThreadMessage[] = THREAD_MESSAGES.map((m, i) => ({ id: `m${i}`, ...m }))

const eventCards: EventCard[] = EVENT_DAYS.flatMap((day) => day.items)

function eventList(tab: EventTab): EventList {
  const keep = (e: EventCard) =>
    tab === "short" ? e.state === "short" : tab === "draft" ? e.state === "draft" : tab !== "past"
  return {
    days: EVENT_DAYS.map((day) => ({ label: day.label, items: day.items.filter(keep) })).filter(
      (day) => day.items.length > 0,
    ),
    upcoming: eventCards.length,
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
    instructions: EVENT_DETAIL.instructions,
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
  }
}

function venueDetail(id: string | undefined): VenueDetail {
  const venue = VENUES.find((v) => v.id === id) ?? VENUES[0]
  return {
    id: venue.id,
    name: venue.name,
    address: venue.id === "grand" ? VENUE_DETAIL.address : `${venue.address} · PT`,
    radiusM: radii.get(venue.id) ?? venue.radius,
    contact: VENUE_DETAIL.rows[0].v,
    dress: VENUE_DETAIL.rows[1].v,
    billRateCents: 3800,
  }
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
    return structuredClone(settings)
  },

  venues: () =>
    wait(
      VENUES.map((v) => ({
        id: v.id,
        name: v.name,
        address: v.address,
        radiusM: radii.get(v.id) ?? v.radius,
        upcoming: v.upcoming,
      })),
    ),
  venue: async (id) => venueDetail(id),
  updateVenue: async (id, patch) => {
    if (patch.radiusM) radii.set(id, patch.radiusM)
    return venueDetail(id)
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
  deactivate: async () => {},

  events: (tab) => wait(eventList(tab)),
  event: async () => eventDetail(),
  createEvent: async () => ({ id: "new-event" }),
  cancelEvent: async () => {},
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

  live: async (): Promise<Live> =>
    structuredClone({
      events: liveEvents,
      timeline: { ...TIMELINE, ticks: [...TIMELINE.ticks] },
      zone: "PT",
      serverNow: new Date().toISOString(),
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
      totalCents: cents(INVOICE_DETAIL.total),
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
  sendInvoice: async () => {
    sentInvoice = true
    return { billedTo: INVOICE_DETAIL.sentTo }
  },

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
  reply: async (_id, text) => {
    const message = { id: `m${threadMessages.length}`, text, meta: "Just now · Jamie", mine: true }
    threadMessages = [...threadMessages, message]
    return structuredClone(message)
  },
  audiences: () => wait(AUDIENCES.map((a) => ({ key: a.key, label: a.label, reach: a.reach }))),
  announce: async () => ({ delivered: 6 }),
}
