import { z } from "zod/mini"

import { ApiError, api } from "../api-client"
import { NotificationsDto } from "../staff/schemas"
import type { AdminRepo } from "./repo"
import {
  AddSlotResultDto,
  AdjustResultDto,
  AnnounceResultDto,
  ApproveCleanResultDto,
  AudienceDto,
  BroadcastResultDto,
  DecideResultDto,
  HoursDto,
  InboxDto,
  InvoiceDetailDto,
  InvoiceRowDto,
  LiveDto,
  NudgeResultDto,
  PayrollDto,
  RemoveResultDto,
  SendInvoiceResultDto,
  SendPayrollResultDto,
  ThreadDetailDto,
  ThreadMessageDto,
} from "./ops-schemas"
import {
  AdminSessionDto,
  AssignResultDto,
  AvailableStaffDto,
  EventDetailDto,
  EventListDto,
  IdDto,
  InviteResultDto,
  PersonDto,
  SettingsDto,
  StaffListDto,
  VenueDetailDto,
  VenueRowDto,
} from "./schemas"

const Ack = z.object({})
const call = { as: "admin" } as const
/** Detail screens are opened from a list with `?id=`; without one there is nothing to load. */
const needsId = <T>(id: string | undefined, load: (id: string) => Promise<T>): Promise<T> =>
  id ? load(id) : Promise.reject(new ApiError(404, "not_found", "Open this page from its list."))
const post = (body?: unknown) => ({ ...call, method: "POST" as const, body })

export const httpAdminRepo: AdminRepo = {
  session: () => api("admin/session", AdminSessionDto, call),

  settings: () => api("admin/settings", SettingsDto, call),
  updateSettings: (patch) =>
    api("admin/settings", SettingsDto, { ...call, method: "PATCH", body: patch }),

  venues: () => api("admin/venues", z.array(VenueRowDto), call),
  venue: (id) => api(`admin/venues/${id ?? "first"}`, VenueDetailDto, call),
  createVenue: (request) => api("admin/venues", VenueDetailDto, post(request)),
  updateVenue: (id, patch) =>
    api(`admin/venues/${id}`, VenueDetailDto, { ...call, method: "PATCH", body: patch }),

  staff: () => api("admin/staff", StaffListDto, call),
  person: (id) => needsId(id, (v) => api(`admin/staff/${v}`, PersonDto, call)),
  invite: (emails) => api("admin/staff/invite", InviteResultDto, post({ emails })),
  deactivate: async (id) => {
    await api(`admin/staff/${id}/deactivate`, Ack, post())
  },
  deleteStaff: async (id) => {
    await api(`admin/staff/${id}/delete`, Ack, post())
  },

  events: (tab) => api(`admin/events?tab=${tab}`, EventListDto, call),
  event: (id) => needsId(id, (v) => api(`admin/events/${v}`, EventDetailDto, call)),
  createEvent: (request) => api("admin/events", IdDto, post(request)),
  updateEvent: (id, patch) =>
    api(`admin/events/${id}`, EventDetailDto, { ...call, method: "PATCH", body: patch }),
  cancelEvent: async (id) => {
    await api(`admin/events/${id}/cancel`, Ack, post())
  },
  availableForWindow: (query) =>
    api(`admin/events/available?${new URLSearchParams(query)}`, AvailableStaffDto, call),
  availableStaff: (id) => api(`admin/events/${id}/available`, AvailableStaffDto, call),
  assign: (id, staffIds) =>
    api(`admin/events/${id}/assign`, AssignResultDto, post(staffIds ? { staffIds } : undefined)),
  addSlot: (id) => api(`admin/events/${id}/slots`, AddSlotResultDto, post()),
  broadcastOpen: (id) => api(`admin/events/${id}/broadcast`, BroadcastResultDto, post()),

  live: () => api("admin/live", LiveDto, call),
  decide: (punchId, decision) =>
    api(`admin/live/requests/${punchId}`, DecideResultDto, post({ decision })),
  nudge: (slotId) => api(`admin/live/slots/${slotId}/nudge`, NudgeResultDto, post()),
  removeFromSlot: (slotId) => api(`admin/live/slots/${slotId}/remove`, RemoveResultDto, post()),

  notifications: () => api("admin/notifications", NotificationsDto, call),
  markNotificationsRead: async () => {
    await api("admin/notifications/read", Ack, post())
  },

  hours: () => api("admin/hours", HoursDto, call),
  approveHours: async (id) => {
    await api(`admin/hours/${id}/approve`, Ack, post())
  },
  approveClean: async () =>
    (await api("admin/hours/approve-clean", ApproveCleanResultDto, post())).approved,
  adjustHours: (id, input) => api(`admin/hours/${id}/adjust`, AdjustResultDto, post(input)),

  invoices: () => api("admin/invoices", z.array(InvoiceRowDto), call),
  invoice: (id) => api(`admin/invoices/${id ?? "first"}`, InvoiceDetailDto, call),
  createInvoice: (request) => api("admin/invoices", IdDto, post(request)),
  sendInvoice: (id) => api(`admin/invoices/${id}/send`, SendInvoiceResultDto, post()),
  payroll: () => api("admin/payroll", PayrollDto, call),
  sendPayroll: () => api("admin/payroll/send", SendPayrollResultDto, post()),
  sendPayrollTo: (staffId: string) =>
    api("admin/payroll/send-to", SendPayrollResultDto, post({ staffId })),

  inbox: () => api("admin/inbox", InboxDto, call),
  thread: (id) => needsId(id, (v) => api(`admin/inbox/threads/${v}`, ThreadDetailDto, call)),
  reply: (id, text) => api(`admin/inbox/threads/${id}/reply`, ThreadMessageDto, post({ text })),
  audiences: (eventId) =>
    api(`admin/inbox/audiences${eventId ? `?eventId=${eventId}` : ""}`, z.array(AudienceDto), call),
  announce: (input) => api("admin/inbox/announce", AnnounceResultDto, post(input)),
}
