// The admin app's data boundary (handoff §6), like StaffRepo: screens depend on this interface;
// the HTTP implementation calls the demo API, the mock one serves the design's fixtures in the
// static export.
import type { Notifications } from "../staff/schemas"
import type {
  AdjustResult,
  AnnounceResult,
  Audience,
  AudienceKey,
  BroadcastResult,
  DecideResult,
  Hours,
  Inbox,
  InvoiceDetail,
  InvoiceRow,
  Live,
  NewInvoiceRequest,
  NudgeResult,
  Payroll,
  RemoveResult,
  ThreadDetail,
  ThreadMessage,
  AddSlotResult,
} from "./ops-schemas"
import type {
  AdminSession,
  AssignResult,
  AvailabilityQuery,
  AvailableStaff,
  EventDetail,
  EventList,
  EventPatch,
  EventTab,
  InviteResult,
  NewEventRequest,
  NewVenueRequest,
  Person,
  Settings,
  SettingsPatch,
  StaffList,
  VenueDetail,
  VenuePatch,
  VenueRow,
} from "./schemas"

export interface AdminRepo {
  session(): Promise<AdminSession>
  notifications(): Promise<Notifications>
  markNotificationsRead(): Promise<void>

  settings(): Promise<Settings>
  updateSettings(patch: SettingsPatch): Promise<Settings>

  venues(): Promise<VenueRow[]>
  /** `id` undefined opens the first venue. */
  venue(id: string | undefined): Promise<VenueDetail>
  createVenue(request: NewVenueRequest): Promise<VenueDetail>
  updateVenue(id: string, patch: VenuePatch): Promise<VenueDetail>

  staff(): Promise<StaffList>
  person(id: string | undefined): Promise<Person>
  invite(emails: string[]): Promise<InviteResult>
  deactivate(id: string): Promise<void>
  /** Hard-delete an inactive staff record (deactivate first). */
  deleteStaff(id: string): Promise<void>

  events(tab: EventTab): Promise<EventList>
  event(id: string | undefined): Promise<EventDetail>
  createEvent(request: NewEventRequest): Promise<{ id: string }>
  /** Edits what the crew is told; the crew is notified when it changes. */
  updateEvent(id: string, patch: EventPatch): Promise<EventDetail>
  cancelEvent(id: string): Promise<void>
  availableStaff(eventId: string): Promise<AvailableStaff>
  /** Who is free for a venue and time, before the event exists. */
  availableForWindow(query: AvailabilityQuery): Promise<AvailableStaff>
  /** Without `staffIds`, the server picks the best-suited free person. */
  assign(eventId: string, staffIds?: string[]): Promise<AssignResult>
  addSlot(eventId: string): Promise<AddSlotResult>
  broadcastOpen(eventId: string): Promise<BroadcastResult>

  live(): Promise<Live>
  decide(punchId: string, decision: "approve" | "reject"): Promise<DecideResult>
  nudge(slotId: string): Promise<NudgeResult>
  removeFromSlot(slotId: string): Promise<RemoveResult>

  hours(): Promise<Hours>
  approveHours(id: string): Promise<void>
  approveClean(): Promise<number>
  adjustHours(id: string, input: { outTime: string; reason: string }): Promise<AdjustResult>

  invoices(): Promise<InvoiceRow[]>
  /** `id` undefined opens the first draft. */
  invoice(id: string | undefined): Promise<InvoiceDetail>
  /** A draft for one venue and period, from the hours approved so far. */
  createInvoice(request: NewInvoiceRequest): Promise<{ id: string }>
  sendInvoice(id: string): Promise<{ billedTo: string }>
  /** Payroll summary: hours worked per staff member over the current billing period. */
  payroll(): Promise<Payroll>
  /** Send each staff member their pay stub as an inbox message. */
  sendPayroll(): Promise<{ sent: number }>

  inbox(): Promise<Inbox>
  thread(id: string | undefined): Promise<ThreadDetail>
  reply(id: string, text: string): Promise<ThreadMessage>
  audiences(eventId?: string): Promise<Audience[]>
  announce(input: {
    audience: AudienceKey
    eventId?: string
    text: string
  }): Promise<AnnounceResult>
}
