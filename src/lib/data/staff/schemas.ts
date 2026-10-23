// Wire format of the staff API, shared by the server (validates what it sends and receives) and
// the client (validates every response; handoff §7). DTOs are staff-facing by construction: there
// is no bill rate or pay rate anywhere in this file (handoff §5.4). Labels are display-ready and
// venue-local, built by lib/time so the server, the mock repository and the design agree.
import { z } from "zod/mini"

import { ICON_NAMES } from "@/lib/icons/icon-names"

const str = z.string()
const bool = z.boolean()
const int = z.int()
const iso = z.string()

const Tone = z.enum([
  "ok",
  "warn",
  "info",
  "bad",
  "bad-solid",
  "strong",
  "neutral",
  "muted",
  "subtle",
  "faint",
  "outline",
])
export const StatusSpecDto = z.object({
  tone: Tone,
  icon: z.enum(ICON_NAMES),
  filled: bool,
  label: str,
})

const Contact = z.object({ text: str, name: str, tel: str })

// ---- Profile ---------------------------------------------------------------------------------

export const StaffProfileDto = z.object({
  id: str,
  initials: str,
  name: str,
  role: str,
  email: str,
  company: str,
  phone: str,
  /** The tenant's brand color: set by the admin, applied across the staff app. */
  accent: str,
  preferences: z.object({ open: bool, remind: bool, msg: bool }),
  permissions: z.object({ push: bool, location: bool, camera: bool, installed: bool }),
})
export type StaffProfile = z.infer<typeof StaffProfileDto>

export const ProfilePatch = z.object({
  preferences: z.optional(z.partial(z.object({ open: bool, remind: bool, msg: bool }))),
  permissions: z.optional(
    z.partial(z.object({ push: bool, location: bool, camera: bool, installed: bool })),
  ),
})
export type ProfilePatch = z.infer<typeof ProfilePatch>

// ---- Home ------------------------------------------------------------------------------------

export const HomeShiftDto = z.object({
  assignmentId: str,
  venue: str,
  address: str,
  shortAddress: str,
  mapsUrl: str,
  /** Venue center: lets a demo place the worker at a known distance (no device GPS yet). */
  venueGeo: z.object({ lat: z.number(), lng: z.number() }),
  /** IANA zone of the venue: every label and clock reading is venue time. */
  timezone: str,
  /** Fence radius and the worst GPS accuracy that can still be judged (tenant settings). */
  radiusM: int,
  neededAccuracyM: int,
  contact: Contact,
  dress: str,
  startsAt: iso,
  endsAt: iso,
  clockInOpensAt: iso,
  windowMin: int,
  dayWord: str,
  dateLabel: str,
  startLabel: str,
  endLabel: str,
  rangeLabel: str,
  whenLabel: str,
  opensLabel: str,
  clockedInAt: z.nullable(iso),
  clockedInLabel: z.nullable(str),
  clockedInDistanceM: z.nullable(int),
})
export type HomeShift = z.infer<typeof HomeShiftDto>

export const UpNextDto = z.object({
  assignmentId: str,
  dow: str,
  day: str,
  venue: str,
  time: str,
})
export type UpNext = z.infer<typeof UpNextDto>

export const HomeDto = z.object({
  shift: z.nullable(HomeShiftDto),
  upNext: z.array(UpNextDto),
  open: z.object({ count: int, titles: z.array(str) }),
  serverNow: iso,
})
export type Home = z.infer<typeof HomeDto>

// ---- Shifts ----------------------------------------------------------------------------------

export const ShiftTab = z.enum(["upcoming", "past"])
export type ShiftTab = z.infer<typeof ShiftTab>

export const ShiftCardDto = z.object({
  id: str,
  status: StatusSpecDto,
  date: str,
  venue: str,
  time: str,
  right: str,
  /** The current or next shift today: opens Home (where the clock action lives), not the detail. */
  isTonight: bool,
})
export type ShiftCard = z.infer<typeof ShiftCardDto>

export const ShiftDetailDto = z.object({
  id: str,
  status: StatusSpecDto,
  start: str,
  title: str,
  when: str,
  clockNotice: z.nullable(str),
  address: str,
  mapsUrl: str,
  report: Contact,
  crew: str,
  instructions: str,
  dropVenue: str,
  dropWhen: str,
  canDrop: bool,
  lateDrop: bool,
})
export type ShiftDetail = z.infer<typeof ShiftDetailDto>

export const DROP_REASON_KEYS = ["sick", "ride", "family", "other"] as const
export const DropRequest = z.object({
  reason: z.enum(DROP_REASON_KEYS),
  note: z.optional(z.string().check(z.maxLength(280))),
})
export type DropRequest = z.infer<typeof DropRequest>

export const DropResultDto = z.object({
  venue: str,
  dateLabel: str,
  timeLabel: str,
  late: bool,
})
export type DropResult = z.infer<typeof DropResultDto>

export const OpenShiftDto = z.object({
  id: str,
  date: str,
  venue: str,
  time: str,
  spots: int,
  conflict: z.optional(str),
})
export type OpenShift = z.infer<typeof OpenShiftDto>

export const ClaimResultDto = z.object({
  outcome: z.enum(["claimed", "filled", "overlap"]),
  venue: str,
  dateLabel: str,
  timeLabel: str,
  conflict: z.optional(z.object({ venue: str, dayWord: str, range: str, isToday: bool })),
})
export type ClaimResult = z.infer<typeof ClaimResultDto>

// ---- Clock -----------------------------------------------------------------------------------

export const LocationSample = z.object({
  lat: z.number().check(z.gte(-90), z.lte(90)),
  lng: z.number().check(z.gte(-180), z.lte(180)),
  accuracyM: z.number().check(z.gte(0)),
})
export type LocationSample = z.infer<typeof LocationSample>

const Verdict = z.enum(["inside", "outside", "low_accuracy"])

export const ClockCheckRequest = z.object({ assignmentId: str, location: LocationSample })
export type ClockCheckRequest = z.infer<typeof ClockCheckRequest>

export const ClockCheckDto = z.object({
  verdict: Verdict,
  distanceM: int,
  radiusM: int,
  neededAccuracyM: int,
  venueName: str,
  hoursLabel: str,
})
export type ClockCheck = z.infer<typeof ClockCheckDto>

export const ClockPunchRequest = z.object({
  idempotencyKey: z.string().check(z.minLength(8), z.maxLength(80)),
  assignmentId: str,
  deviceTimestamp: iso,
  location: z.optional(LocationSample),
  selfie: bool,
  /** The live selfie as a small JPEG data URL; absent when the camera is simulated. */
  selfieImage: z.optional(
    z.string().check(z.maxLength(600_000), z.regex(/^data:image\/jpeg;base64,/)),
  ),
  offline: bool,
  requestApproval: z.optional(bool),
  note: z.optional(z.string().check(z.maxLength(280))),
})
export type ClockPunchRequest = z.infer<typeof ClockPunchRequest>

export const ClockPunchDto = z.object({
  punchId: str,
  status: z.enum(["accepted", "pending_approval"]),
  flagged: bool,
  effectiveAt: iso,
  effectiveLabel: str,
  venueName: str,
  shiftEndLabel: str,
  reportTo: str,
  locationLabel: str,
  workedSecs: z.nullable(int),
})
export type ClockPunch = z.infer<typeof ClockPunchDto>

export const ClockRequestDto = z.object({
  status: z.enum(["pending_approval", "approved", "rejected"]),
  requestedLabel: str,
  effectiveLabel: z.nullable(str),
})
export type ClockRequestStatus = z.infer<typeof ClockRequestDto>

// ---- Messages and notifications --------------------------------------------------------------

export const ChatItemDto = z.union([
  z.object({ kind: z.literal("day"), id: str, text: str }),
  z.object({
    kind: z.literal("message"),
    id: str,
    from: z.enum(["them", "me", "broadcast"]),
    who: z.optional(str),
    text: str,
    ref: z.optional(str),
    img: z.optional(str),
    event: z.optional(z.object({ title: str, meta: str })),
    meta: str,
  }),
])
export type ChatItem = z.infer<typeof ChatItemDto>
export type ChatMessage = Extract<ChatItem, { kind: "message" }>

export const SendMessageRequest = z.object({
  text: z.string().check(z.minLength(1), z.maxLength(1000)),
})

export const NotificationDto = z.object({
  id: str,
  icon: z.enum(ICON_NAMES),
  tone: z.enum(["accent", "info", "ok", "warn"]),
  title: str,
  body: str,
  time: str,
  href: str,
  unread: bool,
})
export type NotificationItem = z.infer<typeof NotificationDto>
export type NotificationTone = NotificationItem["tone"]

export const NotificationsDto = z.object({
  groups: z.array(z.object({ label: str, items: z.array(NotificationDto) })),
  unread: int,
})
export type Notifications = z.infer<typeof NotificationsDto>

// ---- Auth ------------------------------------------------------------------------------------

export const RequestCodeRequest = z.object({ email: z.email() })
export const VerifyCodeRequest = z.object({
  email: z.email(),
  code: z.string().check(z.regex(/^\d{6}$/)),
})
export const SessionDto = z.object({ token: str, expiresAt: iso })
export type Session = z.infer<typeof SessionDto>
