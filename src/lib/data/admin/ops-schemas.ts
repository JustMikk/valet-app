// Live Board, hours review, invoices and inbox: the operational half of the admin wire format.
import { z } from "zod/mini"

import { StatusSpecDto } from "../staff/schemas"

const str = z.string()
const bool = z.boolean()
const int = z.int()

// ---- Live Board ------------------------------------------------------------------------------

export const SlotState = z.enum([
  "onsite",
  "flagged",
  "override",
  "waiting",
  "late",
  "due",
  "upcoming",
  "open",
])
export type SlotState = z.infer<typeof SlotState>

/** The facts behind a slot's state: wording is built from these, never stored as prose. */
export const SlotFactsDto = z.object({
  lateMin: z.optional(int),
  outsideM: z.optional(int),
  accuracyM: z.optional(int),
  note: z.optional(str),
  waitedMin: z.optional(int),
  /** The pending clock-in request, so Approve / Reject can name it. */
  punchId: z.optional(str),
  droppedBy: z.optional(str),
  droppedAt: z.optional(str),
  /** Minutes the slot has been open since it was dropped (or since the event started). */
  openMin: z.optional(int),
  /** When dispatch last messaged this person about being late, if it did. */
  nudgedAt: z.optional(str),
  tel: z.optional(str),
})
export type SlotFacts = z.infer<typeof SlotFactsDto>

export const LiveSlotDto = z.object({
  id: str,
  staffId: z.nullable(str),
  name: str,
  state: SlotState,
  meta: str,
  facts: SlotFactsDto,
  /** Selfie JPEG data URL captured at clock-in (present when the punch had one). */
  selfieUrl: z.optional(z.nullable(str)),
  /** Last punch latitude (present for clocked-in staff). */
  lat: z.optional(z.nullable(z.number())),
  /** Last punch longitude (present for clocked-in staff). */
  lng: z.optional(z.nullable(z.number())),
})
export type LiveSlot = z.infer<typeof LiveSlotDto>

export const LiveEventDto = z.object({
  id: str,
  venue: str,
  time: str,
  /** Start and end as fractional hours on the timeline axis (24+ is after midnight). */
  start: z.number(),
  end: z.number(),
  live: bool,
  rel: str,
  startLabel: str,
  /** Minutes until it starts (negative once started). */
  startsInMin: int,
  slots: z.array(LiveSlotDto),
})
export type LiveEvent = z.infer<typeof LiveEventDto>

/** The Live Board's five counts. */
export const PulseDto = z.object({
  need: int,
  live: int,
  onShift: int,
  expected: int,
  open: int,
})
export type Pulse = z.infer<typeof PulseDto>

export const LiveDto = z.object({
  events: z.array(LiveEventDto),
  timeline: z.object({ from: z.number(), span: z.number(), now: z.number(), ticks: z.array(int) }),
  /** Short zone name of the venues' clock: "PT". */
  zone: str,
  serverNow: str,
  /** The counts at this time yesterday (ADR-021); null until there is a snapshot to compare. */
  yesterday: z.nullable(PulseDto),
})
export type Live = z.infer<typeof LiveDto>

export const DecideRequest = z.object({ decision: z.enum(["approve", "reject"]) })
export const DecideResultDto = z.object({ name: str, atLabel: str })
export type DecideResult = z.infer<typeof DecideResultDto>

export const NudgeResultDto = z.object({ name: str })
export type NudgeResult = z.infer<typeof NudgeResultDto>

export const RemoveResultDto = z.object({ name: str })
export type RemoveResult = z.infer<typeof RemoveResultDto>

export const BroadcastResultDto = z.object({ recipients: int })
export type BroadcastResult = z.infer<typeof BroadcastResultDto>

export const AddSlotResultDto = z.object({ headcount: int })
export type AddSlotResult = z.infer<typeof AddSlotResultDto>

// ---- Hours -----------------------------------------------------------------------------------

export const HoursEntryDto = z.object({
  id: str,
  initials: str,
  name: str,
  venue: str,
  inTime: str,
  outTime: str,
  total: str,
  flag: str,
  /** The out time is the problem (never clocked out, auto-closed at scheduled end). */
  outFlagged: bool,
  approved: bool,
  /** The reason attached when an admin adjusted the times. */
  adjustedReason: z.optional(str),
})
export type HoursEntry = z.infer<typeof HoursEntryDto>

export const HoursDto = z.object({
  period: str,
  cleanCount: int,
  review: z.array(HoursEntryDto),
  approved: z.array(HoursEntryDto),
})
export type Hours = z.infer<typeof HoursDto>

export const AdjustRequest = z.object({
  /** Venue-local 24-hour out time, "23:10". */
  outTime: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
  reason: z.string().check(z.minLength(3), z.maxLength(280)),
})
export const AdjustResultDto = z.object({ outTime: str, total: str, name: str })
export type AdjustResult = z.infer<typeof AdjustResultDto>

export const ApproveCleanResultDto = z.object({ approved: int })

// ---- Invoices --------------------------------------------------------------------------------

export const InvoiceRowDto = z.object({
  id: str,
  venue: str,
  period: str,
  status: StatusSpecDto,
  hours: str,
  amountCents: int,
})
export type InvoiceRow = z.infer<typeof InvoiceRowDto>

export const InvoiceDetailDto = z.object({
  id: str,
  number: str,
  venue: str,
  period: str,
  totalCents: int,
  notice: z.nullable(str),
  billedTo: str,
  sent: bool,
  /** Set when the system drafted it from one event, so the screen can link back to it. */
  eventId: z.optional(str),
  lines: z.array(
    z.object({
      what: str,
      /** An event invoice's line is one worker: "6:02 PM – 11:10 PM". Period lines have none. */
      detail: z.optional(str),
      staffCount: int,
      minutes: int,
      rateCents: int,
      amountCents: int,
    }),
  ),
})
export type InvoiceDetail = z.infer<typeof InvoiceDetailDto>

export const NewInvoiceRequest = z.object({
  venueId: str,
  /** Venue-local calendar dates, "2026-10-16" to "2026-10-31", both included. */
  periodStart: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
  periodEnd: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
})
export type NewInvoiceRequest = z.infer<typeof NewInvoiceRequest>

export const SendInvoiceResultDto = z.object({ billedTo: str })

export const PayrollLineDto = z.object({
  event: str,
  date: str,
  hours: str,
  amountCents: int,
})
export type PayrollLine = z.infer<typeof PayrollLineDto>

export const PayrollRowDto = z.object({
  staffId: str,
  initials: str,
  name: str,
  email: str,
  shifts: int,
  hours: str,
  amountCents: int,
  lines: z.array(PayrollLineDto),
})
export type PayrollRow = z.infer<typeof PayrollRowDto>

export const PayrollDto = z.object({
  period: str,
  rows: z.array(PayrollRowDto),
  totalCents: int,
})
export type Payroll = z.infer<typeof PayrollDto>

export const SendPayrollResultDto = z.object({ sent: int })

// ---- Inbox -----------------------------------------------------------------------------------

export const ThreadDto = z.object({
  id: str,
  initials: str,
  name: str,
  last: str,
  time: str,
  unread: bool,
  announcement: bool,
})
export type Thread = z.infer<typeof ThreadDto>

export const InboxDto = z.object({ threads: z.array(ThreadDto), unread: int })
export type Inbox = z.infer<typeof InboxDto>

export const ThreadMessageDto = z.object({ id: str, text: str, meta: str, mine: bool })
export type ThreadMessage = z.infer<typeof ThreadMessageDto>

export const ThreadDetailDto = z.object({
  id: str,
  name: str,
  initials: str,
  subtitle: str,
  announcement: bool,
  canReply: bool,
  messages: z.array(ThreadMessageDto),
})
export type ThreadDetail = z.infer<typeof ThreadDetailDto>

export const ReplyRequest = z.object({ text: z.string().check(z.minLength(1), z.maxLength(1000)) })

export const AudienceKey = z.enum(["event", "tonight", "all"])
export type AudienceKey = z.infer<typeof AudienceKey>

export const AudienceDto = z.object({ key: AudienceKey, label: str, reach: str })
export type Audience = z.infer<typeof AudienceDto>

export const AnnounceRequest = z.object({
  audience: AudienceKey,
  /** The crew to message when the audience is an event's crew. */
  eventId: z.optional(str),
  text: z.string().check(z.minLength(1), z.maxLength(1000)),
})
export const AnnounceResultDto = z.object({ delivered: int })
export type AnnounceResult = z.infer<typeof AnnounceResultDto>
