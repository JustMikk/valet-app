// Wire format of the admin (dispatch) API, shared by the server and the client like the staff one.
// Display-ready and venue-local. Money is integer cents everywhere; bill rates appear only in
// venue and invoice types, never in anything staff can read (handoff §5.4).
import { z } from "zod/mini"

import { StatusSpecDto } from "../staff/schemas"

const str = z.string()
const bool = z.boolean()
const int = z.int()

export { StatusSpecDto }

// ---- Session and shell -----------------------------------------------------------------------

export const AdminSessionDto = z.object({
  admin: z.object({ initials: str, name: str, role: str, company: str }),
  /** Counts shown on the navigation: what needs the dispatcher right now. */
  badges: z.object({ live: int, hours: int, inbox: int }),
  accent: str,
})
export type AdminSession = z.infer<typeof AdminSessionDto>

// ---- Settings --------------------------------------------------------------------------------

export const ClockRules = z.object({
  windowMin: int,
  radiusM: int,
  accuracyM: int,
  selfie: bool,
  earlyOut: bool,
})
/** Pay and billing defaults (ADR-022): valets' hourly pay for new events, and invoice sales tax. */
export const BillingRules = z.object({
  payRateCents: z.int().check(z.minimum(0), z.maximum(100_000)),
  /** Basis points: 625 is 6.25 %. */
  salesTaxBp: z.int().check(z.minimum(0), z.maximum(5_000)),
})
export const SettingsDto = z.object({
  company: str,
  accent: str,
  rules: ClockRules,
  billing: BillingRules,
})
export type Settings = z.infer<typeof SettingsDto>

export const SettingsPatch = z.object({
  accent: z.optional(z.string().check(z.regex(/^#[0-9a-fA-F]{6}$/))),
  rules: z.optional(z.partial(ClockRules)),
  billing: z.optional(z.partial(BillingRules)),
})
export type SettingsPatch = z.infer<typeof SettingsPatch>

// ---- Venues ----------------------------------------------------------------------------------

export const RADII = [100, 150, 250, 400] as const

export const VenueRowDto = z.object({
  id: str,
  name: str,
  address: str,
  radiusM: int,
  upcoming: str,
})
export type VenueRow = z.infer<typeof VenueRowDto>

export const VenueDetailDto = z.object({
  id: str,
  name: str,
  /** Display line: street address and the venue's zone ("400 Market St, San Francisco · PT"). */
  address: str,
  /** The stored street address, for editing. */
  street: str,
  lat: z.number(),
  lng: z.number(),
  radiusM: int,
  contact: str,
  contactName: str,
  contactTel: str,
  dress: str,
  billingEmail: str,
  billRateCents: int,
})
export type VenueDetail = z.infer<typeof VenueDetailDto>

const radius = z.int().check(z.gte(25), z.lte(2000))
const latitude = z.number().check(z.gte(-90), z.lte(90))
const longitude = z.number().check(z.gte(-180), z.lte(180))
const text = (max: number) => z.string().check(z.trim(), z.maxLength(max))
const venueFields = {
  name: z.string().check(z.trim(), z.minLength(1), z.maxLength(80)),
  street: z.string().check(z.trim(), z.minLength(1), z.maxLength(160)),
  lat: latitude,
  lng: longitude,
  radiusM: radius,
  contactName: text(80),
  contactTel: text(40),
  dress: text(120),
  billingEmail: z.union([z.email(), z.literal("")]),
  /** Dollars per hour billed to the venue, in cents. */
  billRateCents: z.int().check(z.gte(0), z.lte(100_000)),
}

export const NewVenueRequest = z.object(venueFields)
export type NewVenueRequest = z.infer<typeof NewVenueRequest>

export const VenuePatch = z.partial(z.object(venueFields))
export type VenuePatch = z.infer<typeof VenuePatch>

// ---- Staff -----------------------------------------------------------------------------------

export const StaffBucket = z.enum(["active", "invited", "alerts", "inactive"])
export type StaffBucket = z.infer<typeof StaffBucket>
export const StaffTab = z.enum(["all", "active", "invited", "alerts"])
export type StaffTab = z.infer<typeof StaffTab>

export const StaffRowDto = z.object({
  id: str,
  initials: str,
  name: str,
  email: str,
  status: StatusSpecDto,
  bucket: StaffBucket,
  next: str,
  hours: str,
})
export type StaffRow = z.infer<typeof StaffRowDto>

export const StaffListDto = z.object({
  rows: z.array(StaffRowDto),
  total: int,
  invited: int,
  alertsOff: int,
})
export type StaffList = z.infer<typeof StaffListDto>

export const PersonDto = z.object({
  id: str,
  initials: str,
  name: str,
  role: str,
  phone: str,
  active: bool,
  rows: z.array(z.object({ k: str, v: str })),
  shifts: z.array(z.object({ venue: str, when: str, hours: str })),
})
export type Person = z.infer<typeof PersonDto>

// ---- Valet insights (ADR-024) -----------------------------------------------------------------

export const INSIGHT_RANGES = [30, 90, 365] as const
export const InsightRange = z.union([z.literal(30), z.literal(90), z.literal(365)])
export type InsightRange = z.infer<typeof InsightRange>

export const ActivityKind = z.enum([
  "invited",
  "joined",
  "claimed",
  "assigned",
  "dropped",
  "removed",
  "clock_in",
  "clock_out",
  "adjusted",
  "paid",
  "no_show",
])
export type ActivityKind = z.infer<typeof ActivityKind>

export const StaffNoteDto = z.object({ id: str, body: str, author: str, when: str })
export type StaffNote = z.infer<typeof StaffNoteDto>

export const NewStaffNoteRequest = z.object({
  body: z.string().check(z.trim(), z.minLength(1), z.maxLength(2000)),
})

/** Everything about one valet over a period: score, numbers, where/when, log and notes. */
export const PersonInsightsDto = z.object({
  rangeDays: int,
  score: z.object({
    value: z.nullable(int),
    band: z.enum(["excellent", "good", "watch", "risk", "new"]),
    reasons: z.array(str),
  }),
  stats: z.object({
    shifts: int,
    minutes: int,
    onTime: int,
    late: int,
    avgLateMin: z.nullable(int),
    noShows: int,
    drops: int,
    lateDrops: int,
    removed: int,
    claimed: int,
    assigned: int,
    outsideFence: int,
    flagged: int,
    adjustments: int,
    tipsShifts: int,
    earnedCents: int,
    paidCents: int,
    pendingCents: int,
  }),
  upcoming: z.array(z.object({ event: str, when: str })),
  months: z.array(z.object({ label: str, shifts: int, minutes: int, late: int, noShows: int })),
  venues: z.array(z.object({ venue: str, shifts: int, minutes: int })),
  activity: z.array(
    z.object({ id: str, when: str, kind: ActivityKind, title: str, detail: str, issue: bool }),
  ),
  notes: z.array(StaffNoteDto),
})
export type PersonInsights = z.infer<typeof PersonInsightsDto>

/** One valet on the Performance list: score and the numbers behind it for the period. */
export const TeamPerformanceRowDto = z.object({
  staffId: str,
  name: str,
  initials: str,
  score: z.nullable(int),
  band: z.enum(["excellent", "good", "watch", "risk", "new"]),
  shifts: int,
  minutes: int,
  onTimePct: z.nullable(int),
  late: int,
  noShows: int,
  lateDrops: int,
  earnedCents: int,
})
export type TeamPerformanceRow = z.infer<typeof TeamPerformanceRowDto>

export const InviteRequest = z.object({
  emails: z.array(z.email()).check(z.minLength(1), z.maxLength(50)),
})
export const InviteResultDto = z.object({ invited: int, skipped: z.array(str) })
export type InviteResult = z.infer<typeof InviteResultDto>

// ---- Events ----------------------------------------------------------------------------------

export const EventState = z.enum(["live", "short", "full", "draft"])
export type EventState = z.infer<typeof EventState>
export const EventTab = z.enum(["live", "upcoming", "short", "draft", "past"])
export type EventTab = z.infer<typeof EventTab>

export const EventCardDto = z.object({
  id: str,
  venue: str,
  kind: str,
  time: str,
  need: int,
  confirmed: int,
  onSite: int,
  state: EventState,
})
export type EventCard = z.infer<typeof EventCardDto>

export const EventListDto = z.object({
  days: z.array(z.object({ label: str, items: z.array(EventCardDto) })),
  upcoming: int,
  live: int,
  short: int,
  drafts: int,
})
export type EventList = z.infer<typeof EventListDto>

export const RosterRowDto = z.object({
  id: str,
  initials: str,
  name: str,
  detail: str,
  status: StatusSpecDto,
  action: z.optional(z.enum(["Review", "Call"])),
  tel: z.optional(str),
  /** Selfie JPEG data URL from the clock-in punch (live / clocked-in staff only). */
  selfieUrl: z.optional(z.nullable(str)),
  lat: z.optional(z.nullable(z.number())),
  lng: z.optional(z.nullable(z.number())),
})
export type RosterRow = z.infer<typeof RosterRowDto>

export const EventDetailDto = z.object({
  id: str,
  venue: str,
  venueId: str,
  badge: z.object({ label: str, live: bool }),
  summary: str,
  instructions: str,
  stats: z.array(z.object({ n: int, label: str, tone: z.enum(["ok", "warn", "fg"]) })),
  roster: z.array(RosterRowDto),
  openSlots: z.array(str),
  confirmedCount: int,
  cancelled: bool,
  /** Editable fields returned so the edit sheet can pre-fill them. */
  editable: z.optional(
    z.object({
      date: str,
      start: str,
      end: str,
      name: str,
    }),
  ),
})
export type EventDetail = z.infer<typeof EventDetailDto>

export const EventPatch = z.object({
  instructions: z.optional(z.string().check(z.trim(), z.maxLength(1000))),
  date: z.optional(z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/))),
  start: z.optional(z.string().check(z.regex(/^\d{2}:\d{2}$/))),
  end: z.optional(z.string().check(z.regex(/^\d{2}:\d{2}$/))),
  name: z.optional(z.string().check(z.trim(), z.minLength(1), z.maxLength(80))),
})
export type EventPatch = z.infer<typeof EventPatch>

export const FillMode = z.enum(["open", "assign"])
export type FillMode = z.infer<typeof FillMode>

export const NewEventRequest = z.object({
  venueId: str,
  /** Venue-local calendar date, "2026-11-08". */
  date: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
  /** Venue-local 24-hour times, "10:00". An end before the start runs past midnight. */
  start: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
  end: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
  name: z.string().check(z.minLength(1), z.maxLength(80)),
  headcount: z.int().check(z.gte(1), z.lte(40)),
  instructions: z.optional(z.string().check(z.maxLength(1000))),
  fill: FillMode,
  assignStaffIds: z.optional(z.array(str).check(z.maxLength(40))),
  publish: bool,
})
export type NewEventRequest = z.infer<typeof NewEventRequest>

/** Who is free for a venue and time, before the event exists. */
export const AvailabilityQuery = z.object({
  venueId: str,
  date: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
  start: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
  end: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
})
export type AvailabilityQuery = z.infer<typeof AvailabilityQuery>

export const AvailableStaffDto = z.array(z.object({ id: str, initials: str, name: str, note: str }))
export type AvailableStaff = z.infer<typeof AvailableStaffDto>

export const AssignRequest = z.object({ staffIds: z.optional(z.array(str).check(z.maxLength(40))) })
export const AssignResultDto = z.object({ assigned: int, names: z.array(str) })
export type AssignResult = z.infer<typeof AssignResultDto>

export const IdDto = z.object({ id: str })

export const VenueChoicesDto = z.array(z.object({ id: str, name: str }))
