"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useRealtime } from "@/lib/realtime/use-realtime"

import { keys } from "./queries"

/**
 * Valets' messages, announcements and admin notifications show up the moment they happen
 * (ADR-023), with the navigation badges. A notification can come from the floor (a drop, a
 * clock-in request), so the Live Board refreshes with it.
 */
export function useAdminRealtime() {
  const qc = useQueryClient()
  useRealtime("admin", (event) => {
    const touched =
      event === "message"
        ? [keys.inbox, ["admin", "thread"], keys.session]
        : [keys.notifications, keys.session, keys.live]
    for (const queryKey of touched) void qc.invalidateQueries({ queryKey })
  })
}
