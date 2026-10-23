"use client"

// Server state for the staff app (handoff §6: TanStack Query over the repository interface).
import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import {
  staffRepo,
  type ChatItem,
  type ClaimResult,
  type ClockPunch,
  type DropResult,
  type ProfilePatch,
  type ShiftTab,
  type StaffProfile,
} from "@/lib/data"

export const keys = {
  me: ["staff", "me"],
  home: ["staff", "home"],
  shifts: (tab: ShiftTab) => ["staff", "shifts", tab],
  shift: (id: string | undefined) => ["staff", "shift", id ?? "next"],
  open: ["staff", "open"],
  messages: ["staff", "messages"],
  notifications: ["staff", "notifications"],
  /** Result of the last claim, drop or punch: read by the screen the user lands on next. */
  lastClaim: ["staff", "last", "claim"],
  lastDrop: ["staff", "last", "drop"],
  lastPunch: ["staff", "last", "punch"],
} as const

const invalidateShifts = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ["staff", "shifts"] }),
    qc.invalidateQueries({ queryKey: ["staff", "shift"] }),
    qc.invalidateQueries({ queryKey: keys.home }),
    qc.invalidateQueries({ queryKey: keys.open }),
    qc.invalidateQueries({ queryKey: keys.notifications }),
  ])

export const useProfile = () => useQuery({ queryKey: keys.me, queryFn: () => staffRepo.me() })

export const useHome = () =>
  useQuery({ queryKey: keys.home, queryFn: () => staffRepo.home(), refetchInterval: 30_000 })

export const useShifts = (tab: ShiftTab) =>
  useQuery({ queryKey: keys.shifts(tab), queryFn: () => staffRepo.shifts(tab) })

export const useShift = (id: string | undefined) =>
  useQuery({ queryKey: keys.shift(id), queryFn: () => staffRepo.shift(id) })

export const useOpenShifts = () =>
  useQuery({ queryKey: keys.open, queryFn: () => staffRepo.openShifts() })

export const useMessages = () =>
  useQuery({
    queryKey: keys.messages,
    queryFn: () => staffRepo.messages(),
    refetchInterval: 3000,
  })

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => staffRepo.notifications() })

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: ProfilePatch) => staffRepo.updateMe(patch),
    // Toggles flip immediately; the server's answer replaces the guess (or it rolls back).
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: keys.me })
      const previous = qc.getQueryData<StaffProfile>(keys.me)
      if (previous) {
        qc.setQueryData<StaffProfile>(keys.me, {
          ...previous,
          preferences: { ...previous.preferences, ...patch.preferences },
          permissions: { ...previous.permissions, ...patch.permissions },
        })
      }
      return { previous }
    },
    onError: (_error, _patch, context) => qc.setQueryData(keys.me, context?.previous),
    onSuccess: (profile) => qc.setQueryData(keys.me, profile),
  })
}

export function useClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => staffRepo.claim(id),
    onSuccess: async (result: ClaimResult) => {
      qc.setQueryData(keys.lastClaim, result)
      await invalidateShifts(qc)
    },
  })
}

export function useDrop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      reason: Parameters<typeof staffRepo.drop>[1]["reason"]
      note?: string
    }) => staffRepo.drop(input.id, { reason: input.reason, note: input.note }),
    onSuccess: async (result: DropResult) => {
      qc.setQueryData(keys.lastDrop, result)
      await invalidateShifts(qc)
    },
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => staffRepo.sendMessage(text),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: keys.messages })
      const previous = qc.getQueryData<ChatItem[]>(keys.messages)
      const pending: ChatItem = {
        kind: "message",
        id: `pending-${Date.now()}`,
        from: "me",
        text,
        meta: "Sending…",
      }
      qc.setQueryData<ChatItem[]>(keys.messages, (all = []) => [...all, pending])
      return { previous }
    },
    onError: (_error, _text, context) => qc.setQueryData(keys.messages, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.messages }),
  })
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => staffRepo.markNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  })
}

/** Clock punches change Home and the shift lists, so they refresh together. Stable across renders. */
export function useAfterPunch() {
  const qc = useQueryClient()
  return useCallback(
    async (punch: ClockPunch) => {
      qc.setQueryData(keys.lastPunch, punch)
      await invalidateShifts(qc)
    },
    [qc],
  )
}

/** The stashed result of the last claim / drop / punch (undefined after a reload). */
export function useStash<T>(key: readonly unknown[]): T | undefined {
  return useQueryClient().getQueryData<T>(key)
}
