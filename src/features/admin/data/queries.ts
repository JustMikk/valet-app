"use client"

// Server state for the admin app (handoff §6: TanStack Query over the repository interface).
// After any change, every active admin query refreshes, so the nav badges, lists and the Live
// Board never disagree about what just happened.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  adminRepo,
  type AudienceKey,
  type EventPatch,
  type EventTab,
  type NewEventRequest,
  type NewInvoiceRequest,
  type NewVenueRequest,
  type SettingsPatch,
  type VenuePatch,
} from "@/lib/data"

export const keys = {
  all: ["admin"],
  session: ["admin", "session"],
  notifications: ["admin", "notifications"],
  settings: ["admin", "settings"],
  venues: ["admin", "venues"],
  venue: (id: string | undefined) => ["admin", "venue", id ?? "first"],
  staff: ["admin", "staff"],
  person: (id: string | undefined) => ["admin", "person", id ?? "none"],
  events: (tab: EventTab) => ["admin", "events", tab],
  event: (id: string | undefined) => ["admin", "event", id ?? "none"],
  available: (id: string) => ["admin", "available", id],
  live: ["admin", "live"],
  hours: ["admin", "hours"],
  invoices: ["admin", "invoices"],
  invoice: (id: string | undefined) => ["admin", "invoice", id ?? "first"],
  inbox: ["admin", "inbox"],
  thread: (id: string | undefined) => ["admin", "thread", id ?? "none"],
  audiences: (eventId: string | undefined) => ["admin", "audiences", eventId ?? "soonest"],
} as const

/** Refreshes every active admin query: one change can touch badges, lists and the board. */
export function useRefresh() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: keys.all })
}

export const useSession = () =>
  useQuery({ queryKey: keys.session, queryFn: () => adminRepo.session(), refetchInterval: 30_000 })

export const useNotifications = () =>
  useQuery({
    queryKey: keys.notifications,
    queryFn: () => adminRepo.notifications(),
    refetchInterval: 15_000,
  })

export function useMarkNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminRepo.markNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  })
}

export const useSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => adminRepo.settings() })

export function useUpdateSettings() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (patch: SettingsPatch) => adminRepo.updateSettings(patch),
    onSuccess: refresh,
  })
}

export const useVenues = () =>
  useQuery({ queryKey: keys.venues, queryFn: () => adminRepo.venues() })

export const useVenue = (id: string | undefined) =>
  useQuery({ queryKey: keys.venue(id), queryFn: () => adminRepo.venue(id) })

export function useCreateVenue() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (request: NewVenueRequest) => adminRepo.createVenue(request),
    onSuccess: refresh,
  })
}

export function useUpdateVenue() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { id: string; patch: VenuePatch }) =>
      adminRepo.updateVenue(input.id, input.patch),
    onSuccess: refresh,
  })
}

export const useStaff = () => useQuery({ queryKey: keys.staff, queryFn: () => adminRepo.staff() })

export const usePerson = (id: string | undefined) =>
  useQuery({ queryKey: keys.person(id), queryFn: () => adminRepo.person(id) })

export function useInvite() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (emails: string[]) => adminRepo.invite(emails),
    onSuccess: refresh,
  })
}

export function useDeactivate() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => adminRepo.deactivate(id), onSuccess: refresh })
}

export const useEvents = (tab: EventTab) =>
  useQuery({ queryKey: keys.events(tab), queryFn: () => adminRepo.events(tab) })

export const useEvent = (id: string | undefined) =>
  useQuery({ queryKey: keys.event(id), queryFn: () => adminRepo.event(id) })

export function useCreateEvent() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (request: NewEventRequest) => adminRepo.createEvent(request),
    onSuccess: refresh,
  })
}

export function useUpdateEvent() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { id: string; patch: EventPatch }) =>
      adminRepo.updateEvent(input.id, input.patch),
    onSuccess: refresh,
  })
}

export function useCancelEvent() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => adminRepo.cancelEvent(id), onSuccess: refresh })
}

export const useAvailable = (eventId: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.available(eventId),
    queryFn: () => adminRepo.availableStaff(eventId),
    enabled,
  })

export function useAssign() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { eventId: string; staffIds?: string[] }) =>
      adminRepo.assign(input.eventId, input.staffIds),
    onSuccess: refresh,
  })
}

export const useLive = () =>
  useQuery({ queryKey: keys.live, queryFn: () => adminRepo.live(), refetchInterval: 5000 })

export const useHours = () => useQuery({ queryKey: keys.hours, queryFn: () => adminRepo.hours() })

export function useHoursActions() {
  const refresh = useRefresh()
  return {
    approve: useMutation({
      mutationFn: (id: string) => adminRepo.approveHours(id),
      onSuccess: refresh,
    }),
    approveClean: useMutation({ mutationFn: () => adminRepo.approveClean(), onSuccess: refresh }),
    adjust: useMutation({
      mutationFn: (input: { id: string; outTime: string; reason: string }) =>
        adminRepo.adjustHours(input.id, { outTime: input.outTime, reason: input.reason }),
      onSuccess: refresh,
    }),
  }
}

export const useInvoices = () =>
  useQuery({ queryKey: keys.invoices, queryFn: () => adminRepo.invoices() })

export const useInvoice = (id: string | undefined) =>
  useQuery({ queryKey: keys.invoice(id), queryFn: () => adminRepo.invoice(id) })

export function useCreateInvoice() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (request: NewInvoiceRequest) => adminRepo.createInvoice(request),
    onSuccess: refresh,
  })
}

export function useSendInvoice() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: (id: string) => adminRepo.sendInvoice(id), onSuccess: refresh })
}

export const useInbox = () =>
  useQuery({ queryKey: keys.inbox, queryFn: () => adminRepo.inbox(), refetchInterval: 5000 })

export const useThread = (id: string | undefined) =>
  useQuery({
    queryKey: keys.thread(id),
    queryFn: () => adminRepo.thread(id),
    refetchInterval: 4000,
  })

export function useReply() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { id: string; text: string }) => adminRepo.reply(input.id, input.text),
    onSuccess: refresh,
  })
}

export const useAudiences = (eventId: string | undefined) =>
  useQuery({ queryKey: keys.audiences(eventId), queryFn: () => adminRepo.audiences(eventId) })

export function useAnnounce() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: { audience: AudienceKey; eventId?: string; text: string }) =>
      adminRepo.announce(input),
    onSuccess: refresh,
  })
}
