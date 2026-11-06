"use client"

// Server state for event pay (ADR-022): each event's pay sheet and Payroll's "By event" list.
import { useMutation, useQuery } from "@tanstack/react-query"

import { adminRepo, type PayMarkPatch } from "@/lib/data"

import { keys, useRefresh } from "./queries"

export const useEventPay = (eventId: string) =>
  useQuery({ queryKey: keys.eventPay(eventId), queryFn: () => adminRepo.eventPay(eventId) })

export const usePayrollEvents = () =>
  useQuery({ queryKey: ["admin", "payroll-events"], queryFn: () => adminRepo.payrollEvents() })

/** Rate, paid, tips and pay-stub actions on an event's sheet; payroll and hours refresh with it. */
export function useEventPayActions(eventId: string) {
  const refresh = useRefresh()
  return {
    setRate: useMutation({
      mutationFn: (rateCents: number) => adminRepo.setEventPayRate(eventId, rateCents),
      onSuccess: refresh,
    }),
    mark: useMutation({
      mutationFn: (input: { assignmentId: string; patch: PayMarkPatch }) =>
        adminRepo.markEventPay(eventId, input.assignmentId, input.patch),
      onSuccess: refresh,
    }),
    markAll: useMutation({
      mutationFn: () => adminRepo.markAllEventPaid(eventId),
      onSuccess: refresh,
    }),
    /** Without a staff id, everyone who finished the event gets their pay stub. */
    send: useMutation({
      mutationFn: (staffId?: string) => adminRepo.sendEventPay(eventId, staffId),
      onSuccess: refresh,
    }),
  }
}
