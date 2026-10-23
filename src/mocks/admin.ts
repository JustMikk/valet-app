import { ADMIN_STATUS } from "@/lib/status/admin"
import type { StatusSpec } from "@/lib/status/presets"

export { ADMIN_STATUS }

// Illustrative admin fixtures from the design export (Admin Pages.dc.html). Not the real API.
export const ADMIN_USER = {
  initials: "JC",
  name: "Jamie Cole",
  role: "Owner · Admin",
  company: "Regency Valet Parking",
} as const

// ── Events ────────────────────────────────────────────────────────────────────────────────────
export type EventState = "live" | "short" | "full" | "draft"
export type EventTab = "upcoming" | "short" | "draft" | "past"

export type EventCard = {
  id: string
  venue: string
  kind: string
  time: string
  need: number
  confirmed: number
  onSite: number
  state: EventState
}

export const EVENT_DAYS: { label: string; items: EventCard[] }[] = [
  {
    label: "TODAY · FRI OCT 23",
    items: [
      {
        id: "grand",
        venue: "The Grand Hotel",
        kind: "Corporate dinner",
        time: "6:00 PM",
        need: 8,
        confirmed: 6,
        onSite: 4,
        state: "live",
      },
      {
        id: "laurel",
        venue: "The Laurel Club",
        kind: "Members night",
        time: "7:30 PM",
        need: 6,
        confirmed: 4,
        onSite: 0,
        state: "short",
      },
    ],
  },
  {
    label: "SAT OCT 24",
    items: [
      {
        id: "harbor",
        venue: "Harbor Pavilion",
        kind: "Wedding",
        time: "4:00 PM",
        need: 8,
        confirmed: 8,
        onSite: 0,
        state: "full",
      },
    ],
  },
  {
    label: "NEXT WEEK",
    items: [
      {
        id: "harbor-brunch",
        venue: "Harbor Pavilion",
        kind: "Sunday brunch",
        time: "Sun 10 AM",
        need: 5,
        confirmed: 2,
        onSite: 0,
        state: "short",
      },
      {
        id: "osteria",
        venue: "Osteria Nove",
        kind: "Dinner service",
        time: "Tue 5:30 PM",
        need: 2,
        confirmed: 2,
        onSite: 0,
        state: "full",
      },
      {
        id: "grand-board",
        venue: "The Grand Hotel",
        kind: "Board dinner",
        time: "Wed 5 PM",
        need: 4,
        confirmed: 3,
        onSite: 0,
        state: "short",
      },
      {
        id: "maison",
        venue: "Maison Blanc",
        kind: "Halloween gala",
        time: "Sat 7 PM",
        need: 10,
        confirmed: 6,
        onSite: 0,
        state: "short",
      },
      {
        id: "westfield",
        venue: "Westfield Gala",
        kind: "Charity auction",
        time: "Sun Nov 1",
        need: 6,
        confirmed: 0,
        onSite: 0,
        state: "draft",
      },
    ],
  },
]

export const EVENT_TABS: { value: EventTab; label: string; count?: number }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "short", label: "Short-staffed", count: 4 },
  { value: "draft", label: "Drafts", count: 1 },
  { value: "past", label: "Past" },
]

export type RosterRow = {
  initials: string
  name: string
  detail: string
  status: StatusSpec
  action?: "Review" | "Call"
}

export const EVENT_DETAIL = {
  venue: "The Grand Hotel",
  summary: "Corporate dinner · 6:00 – 11:00 PM · 400 Market St",
  when: "Fri Oct 23",
  instructions:
    "Ask for Priya at the front desk. Black suit, no sneakers. Staff park in the east lot, B1. Front drive closed until 6:30; use the Mission St side entrance.",
  stats: [
    { n: 4, label: "On site", tone: "ok" },
    { n: 2, label: "Need you", tone: "warn" },
    { n: 2, label: "Unfilled", tone: "fg" },
  ],
  roster: [
    {
      initials: "JE",
      name: "Jordan Ellis",
      detail: "In 5:51 PM · 38 m · selfie ok",
      status: ADMIN_STATUS.onSite,
    },
    {
      initials: "MP",
      name: "Maya Patel",
      detail: "In 5:44 PM · 22 m",
      status: ADMIN_STATUS.onSite,
    },
    { initials: "DK", name: "Devon Kim", detail: "In 5:47 PM · 61 m", status: ADMIN_STATUS.onSite },
    {
      initials: "LT",
      name: "Luis Torres",
      detail: "Requested 5:52 PM · 420 m, garage L3",
      status: ADMIN_STATUS.approval,
      action: "Review",
    },
    {
      initials: "AB",
      name: "Ari Brooks",
      detail: "Starts 6:00 PM · not clocked in",
      status: ADMIN_STATUS.late(4),
      action: "Call",
    },
    {
      initials: "SR",
      name: "Sam Rivera",
      detail: "Confirmed · arrives with 2nd wave",
      status: ADMIN_STATUS.expected,
    },
  ] satisfies RosterRow[],
  openSlots: ["Posted 2:00 PM", "Posted 2:00 PM"],
} as const

export const AVAILABLE_STAFF = [
  { initials: "KM", name: "Kai Morgan", note: "Free tonight · worked here 3×" },
  { initials: "NO", name: "Nia Okafor", note: "Free tonight" },
  { initials: "RC", name: "Rob Chen", note: "Free · last shift 3 weeks ago" },
] as const

export const NEW_EVENT_FIELDS = [
  { label: "Venue", icon: "location_on", value: "Harbor Pavilion", chevron: true },
  { label: "Date", icon: "calendar_month", value: "Sun Nov 8, 2026", chevron: true },
  { label: "Time (venue, PT)", icon: "schedule", value: "10:00 AM – 3:00 PM", chevron: false },
  { label: "Event name", icon: "edit", value: "Sunday brunch", chevron: false },
] as const

export const FILL_MODES = [
  { key: "open", label: "Post as open shifts", note: "First to claim gets it", icon: "bolt" },
  {
    key: "assign",
    label: "Assign people now",
    note: "Pick names; the rest post as open",
    icon: "how_to_reg",
  },
] as const
export type FillMode = (typeof FILL_MODES)[number]["key"]

// ── Staff ─────────────────────────────────────────────────────────────────────────────────────
export type StaffBucket = "active" | "invited" | "alerts" | "inactive"
export type StaffRow = {
  initials: string
  name: string
  email: string
  status: StatusSpec
  bucket: StaffBucket
  next: string
  hours: string
}

export const STAFF_ROWS: StaffRow[] = [
  {
    initials: "JE",
    name: "Jordan Ellis",
    email: "jordan.ellis@gmail.com",
    status: ADMIN_STATUS.onShift,
    bucket: "active",
    next: "Tonight · Grand Hotel",
    hours: "17h 30m",
  },
  {
    initials: "MP",
    name: "Maya Patel",
    email: "maya.p@gmail.com",
    status: ADMIN_STATUS.onShift,
    bucket: "active",
    next: "Tonight · Grand Hotel",
    hours: "22h 05m",
  },
  {
    initials: "SR",
    name: "Sam Rivera",
    email: "sam.rivera@icloud.com",
    status: ADMIN_STATUS.active,
    bucket: "active",
    next: "Sat · Harbor Pavilion",
    hours: "9h 40m",
  },
  {
    initials: "AB",
    name: "Ari Brooks",
    email: "ari.b@gmail.com",
    status: ADMIN_STATUS.alertsOff,
    bucket: "alerts",
    next: "Tonight · Grand Hotel",
    hours: "12h 00m",
  },
  {
    initials: "LT",
    name: "Luis Torres",
    email: "ltorres@outlook.com",
    status: ADMIN_STATUS.active,
    bucket: "active",
    next: "Tonight · Grand Hotel",
    hours: "15h 20m",
  },
  {
    initials: "KM",
    name: "Kai Morgan",
    email: "kai.morgan@gmail.com",
    status: ADMIN_STATUS.invited,
    bucket: "invited",
    next: "Not joined yet",
    hours: "—",
  },
  {
    initials: "NO",
    name: "Nia Okafor",
    email: "nia.okafor@gmail.com",
    status: ADMIN_STATUS.active,
    bucket: "active",
    next: "Sun · Harbor brunch",
    hours: "6h 15m",
  },
  {
    initials: "RC",
    name: "Rob Chen",
    email: "rob.chen@gmail.com",
    status: ADMIN_STATUS.inactive,
    bucket: "inactive",
    next: "—",
    hours: "—",
  },
]

export type StaffTab = "all" | "active" | "invited" | "alerts"
export const STAFF_TABS: { value: StaffTab; label: string; count?: number }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited", count: 1 },
  { value: "alerts", label: "Alerts off", count: 1 },
]

export const PERSON = {
  initials: "JE",
  name: "Jordan Ellis",
  role: "Valet attendant · joined Mar 2026",
  phone: "+14155550123",
  rows: [
    { k: "Phone", v: "(415) 555-0123" },
    { k: "Email", v: "jordan.ellis@gmail.com" },
    { k: "App installed", v: "Yes · iPhone" },
    { k: "Notifications", v: "On" },
    { k: "Hours this pay period", v: "17h 30m" },
  ],
  shifts: [
    { venue: "The Grand Hotel", when: "Tonight · in 5:51 PM", hours: "live" },
    { venue: "Maison Blanc", when: "Thu Oct 22", hours: "5h 12m" },
    { venue: "Osteria Nove", when: "Tue Oct 20", hours: "4h 52m" },
    { venue: "Westfield Gala", when: "Sat Oct 17", hours: "4h 18m" },
  ],
} as const

// ── Venues ────────────────────────────────────────────────────────────────────────────────────
export const RADII = [100, 150, 250, 400] as const
export type Radius = (typeof RADII)[number]

export const VENUES: {
  id: string
  name: string
  address: string
  radius: Radius
  upcoming: string
}[] = [
  {
    id: "grand",
    name: "The Grand Hotel",
    address: "400 Market St",
    radius: 150,
    upcoming: "3 upcoming",
  },
  {
    id: "harbor",
    name: "Harbor Pavilion",
    address: "Pier 3, The Embarcadero",
    radius: 250,
    upcoming: "2 upcoming",
  },
  {
    id: "maison",
    name: "Maison Blanc",
    address: "88 Fillmore St",
    radius: 150,
    upcoming: "1 upcoming",
  },
  {
    id: "osteria",
    name: "Osteria Nove",
    address: "1201 Valencia St",
    radius: 100,
    upcoming: "1 upcoming",
  },
  {
    id: "laurel",
    name: "The Laurel Club",
    address: "2 Laurel Ave",
    radius: 150,
    upcoming: "Tonight",
  },
  {
    id: "westfield",
    name: "Westfield Gala",
    address: "Westfield Centre, L4",
    radius: 400,
    upcoming: "Draft",
  },
]

export const VENUE_DETAIL = {
  name: "The Grand Hotel",
  address: "400 Market St, San Francisco · PT",
  rows: [
    { k: "Venue contact", v: "Priya · front desk" },
    { k: "Default dress code", v: "Black suit" },
  ],
  billRate: "$38.00 / h",
} as const

// ── Hours ─────────────────────────────────────────────────────────────────────────────────────
export type HoursEntry = {
  id: string
  initials: string
  name: string
  venue: string
  inTime: string
  outTime: string
  total: string
  flag: string
  /** The out time is the problem (auto-closed). */
  outFlagged?: boolean
  /** Opens the adjust sheet instead of a plain approve. */
  adjustable?: boolean
}

export const HOURS_ENTRIES: HoursEntry[] = [
  {
    id: "sam",
    initials: "SR",
    name: "Sam Rivera",
    venue: "Harbor Pavilion · Sat Oct 24",
    inTime: "3:52 PM",
    outTime: "11:30 PM",
    total: "7h 38m",
    flag: "No clock-out. Auto-closed at scheduled end.",
    outFlagged: true,
    adjustable: true,
  },
  {
    id: "luis",
    initials: "LT",
    name: "Luis Torres",
    venue: "Grand Hotel · Thu Oct 22",
    inTime: "5:52 PM",
    outTime: "11:02 PM",
    total: "5h 10m",
    flag: "Clocked in 420 m away, approved by Jamie (garage).",
  },
  {
    id: "ari",
    initials: "AB",
    name: "Ari Brooks",
    venue: "Osteria Nove · Tue Oct 20",
    inTime: "5:41 PM",
    outTime: "9:12 PM",
    total: "3h 31m",
    flag: "Left 1h 18m early. Note: “family emergency”.",
  },
  {
    id: "maya",
    initials: "MP",
    name: "Maya Patel",
    venue: "Maison Blanc · Thu Oct 22",
    inTime: "5:48 PM",
    outTime: "11:06 PM",
    total: "5h 18m",
    flag: "Synced 2h late (was offline). Times are from the phone.",
  },
]

export const CLEAN_ENTRIES = 18
export const ADJUSTED = { outTime: "11:10 PM", total: "7h 18m" } as const

// ── Invoices ──────────────────────────────────────────────────────────────────────────────────
const INVOICE_DRAFT: StatusSpec = { tone: "neutral", icon: "edit", filled: true, label: "Draft" }

export const INVOICES: {
  venue: string
  period: string
  status: StatusSpec
  hours: string
  amount: string
}[] = [
  {
    venue: "Harbor Pavilion",
    period: "Oct 16 – 31",
    status: INVOICE_DRAFT,
    hours: "139.0 h",
    amount: "$5,282.00",
  },
  {
    venue: "The Grand Hotel",
    period: "Oct 16 – 31",
    status: INVOICE_DRAFT,
    hours: "96.5 h",
    amount: "$3,667.00",
  },
  {
    venue: "Maison Blanc",
    period: "Oct 1 – 15",
    status: ADMIN_STATUS.overdue(6),
    hours: "72.0 h",
    amount: "$2,736.00",
  },
  {
    venue: "The Grand Hotel",
    period: "Oct 1 – 15",
    status: ADMIN_STATUS.paid,
    hours: "126.5 h",
    amount: "$4,807.00",
  },
  {
    venue: "Osteria Nove",
    period: "Oct 1 – 15",
    status: ADMIN_STATUS.sent,
    hours: "40.0 h",
    amount: "$1,400.00",
  },
]

export const INVOICE_DETAIL = {
  number: "INV-2026-0142 · DRAFT",
  venue: "Harbor Pavilion",
  period: "Oct 16 – 31, 2026 · from approved hours",
  total: "$5,282.00",
  notice: "2 entries from Oct 24 are still in review and not included.",
  sentTo: "billing@harborpavilion.com",
  lines: [
    { what: "Wedding · Sat Oct 24", calc: "8 staff · 58.5 h × $38.00", amount: "$2,223.00" },
    { what: "Sunday brunch · Oct 18", calc: "5 staff · 24.5 h × $38.00", amount: "$931.00" },
    { what: "Corporate lunch · Oct 21", calc: "7 staff · 56.0 h × $38.00", amount: "$2,128.00" },
  ],
} as const

// ── Inbox ─────────────────────────────────────────────────────────────────────────────────────
export type Thread = {
  initials: string
  name: string
  last: string
  time: string
  unread?: boolean
  /** Announcement threads draw an accent avatar with a megaphone. */
  announcement?: boolean
}

export const THREADS: Thread[] = [
  {
    initials: "JE",
    name: "Jordan Ellis",
    last: "Which entrance should I use tonight?",
    time: "5:39 PM",
    unread: true,
  },
  {
    initials: "LT",
    name: "Luis Torres",
    last: "I’m on garage level 3, GPS is off",
    time: "5:52 PM",
    unread: true,
  },
  {
    initials: "",
    name: "Announcement · All staff",
    last: "Halloween at Maison Blanc needs 4 more…",
    time: "3:00 PM",
    announcement: true,
  },
  { initials: "MP", name: "Maya Patel", last: "Thanks! See you there", time: "2:14 PM" },
  {
    initials: "GH",
    name: "Grand Hotel crew · 6",
    last: "Front drive closed until 6:30",
    time: "1:30 PM",
  },
]

export const THREAD_MESSAGES = [
  {
    text: "Hi Jordan, Priya at the front desk is your contact tonight. Park in the east lot, level B1.",
    meta: "2:10 PM · Jamie",
    mine: true,
  },
  { text: "Got it, thanks! See you there.", meta: "2:14 PM", mine: false },
  {
    text: "Which entrance should I use tonight? Front looks blocked.",
    meta: "5:39 PM",
    mine: false,
  },
] as const

export const AUDIENCES = [
  { key: "event", label: "Grand Hotel crew · 6", reach: "6 people · all have notifications on" },
  {
    key: "tonight",
    label: "Everyone working tonight · 10",
    reach: "10 people · 1 has notifications off and will see it in their inbox",
  },
  {
    key: "all",
    label: "All staff · 42",
    reach: "42 people · 3 have notifications off and will see it in their inbox",
  },
] as const
export type AudienceKey = (typeof AUDIENCES)[number]["key"]

export const BROADCAST_DEFAULT =
  "Front drive is closed until 6:30. Use the Mission St side entrance and stage keys at the side podium."

// ── Settings ──────────────────────────────────────────────────────────────────────────────────
export type ClockRuleKey = "selfie" | "early"
export type ClockRule =
  | { label: string; note: string; value: string; toggle?: undefined }
  | { label: string; note: string; toggle: ClockRuleKey; value?: undefined }

export const CLOCK_RULES: ClockRule[] = [
  { label: "Clock-in window", note: "How early staff can clock in", value: "15 min before" },
  { label: "Default geofence", note: "New venues start with this radius", value: "150 m" },
  { label: "Location accuracy needed", note: "Readings looser than this retry", value: "±75 m" },
  { label: "Selfie at clock-in", note: "Front camera photo with each clock-in", toggle: "selfie" },
  {
    label: "Flag early clock-outs",
    note: "More than 30 min before scheduled end",
    toggle: "early",
  },
]
