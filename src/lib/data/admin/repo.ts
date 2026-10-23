// The admin app's data boundary (handoff §6), like StaffRepo: screens depend on this interface;
// the HTTP implementation calls the demo API, the mock one serves the design's fixtures in the
// static export.
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
  NudgeResult,
  RemoveResult,
  ThreadDetail,
  ThreadMessage,
  AddSlotResult,
} from "./ops-schemas"
import type {
  AdminSession,
  AssignResult,
  AvailableStaff,
  EventDetail,
  EventList,
  EventTab,
  InviteResult,
  NewEventRequest,
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

  settings(): Promise<Settings>
  updateSettings(patch: SettingsPatch): Promise<Settings>

  venues(): Promise<VenueRow[]>
  /** `id` undefined opens the first venue. */
  venue(id: string | undefined): Promise<VenueDetail>
  updateVenue(id: string, patch: VenuePatch): Promise<VenueDetail>

  staff(): Promise<StaffList>
  person(id: string | undefined): Promise<Person>
  invite(emails: string[]): Promise<InviteResult>
  deactivate(id: string): Promise<void>

  events(tab: EventTab): Promise<EventList>
  event(id: string | undefined): Promise<EventDetail>
  createEvent(request: NewEventRequest): Promise<{ id: string }>
  cancelEvent(id: string): Promise<void>
  availableStaff(eventId: string): Promise<AvailableStaff>
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
  sendInvoice(id: string): Promise<{ billedTo: string }>

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
