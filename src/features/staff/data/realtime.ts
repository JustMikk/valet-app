"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useRealtime } from "@/lib/realtime/use-realtime"

import { invalidateShifts, keys } from "./queries"

/**
 * Messages, announcements and notifications show up the moment they're sent (ADR-023). A
 * notification usually means a shift changed (assigned, cancelled, reminded), so shifts refresh too.
 */
export function useStaffRealtime() {
  const qc = useQueryClient()
  useRealtime("staff", (event) => {
    if (event === "message") void qc.invalidateQueries({ queryKey: keys.messages })
    else void invalidateShifts(qc)
  })
}
