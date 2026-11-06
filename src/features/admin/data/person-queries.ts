"use client"

// Server state for a valet's insights (ADR-024): score, numbers, activity log and notes.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminRepo, type InsightRange, type PersonInsights, type StaffNote } from "@/lib/data"

const insightsKey = (id: string, days: InsightRange) => ["admin", "person-insights", id, days]

export const usePersonInsights = (id: string, days: InsightRange) =>
  useQuery({
    queryKey: insightsKey(id, days),
    queryFn: () => adminRepo.personInsights(id, days),
  })

/** Adding or removing a note updates every cached range of this person's insights in place. */
export function useStaffNoteActions(id: string) {
  const qc = useQueryClient()
  const store = (notes: StaffNote[]) =>
    qc.setQueriesData<PersonInsights>({ queryKey: ["admin", "person-insights", id] }, (old) =>
      old ? { ...old, notes } : old,
    )
  return {
    add: useMutation({
      mutationFn: (body: string) => adminRepo.addStaffNote(id, body),
      onSuccess: store,
    }),
    remove: useMutation({
      mutationFn: (noteId: string) => adminRepo.deleteStaffNote(id, noteId),
      onSuccess: store,
    }),
  }
}
