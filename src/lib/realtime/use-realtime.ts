"use client"

import { useEffect, useEffectEvent, useSyncExternalStore } from "react"

import { DATA_SOURCE } from "@/lib/data"
import type { Role } from "@/lib/data/api-client"
import { realtimeApi } from "@/lib/data/realtime-client"
import type { RealtimeEventName } from "@/lib/data/realtime-schemas"

import { connectRealtime, type RealtimeDeps, type RealtimeStatus } from "./connect"

export type { RealtimeStatus }

const statuses: Record<Role, RealtimeStatus> = { staff: "off", admin: "off" }
const watchers = new Set<() => void>()

function setStatus(role: Role, status: RealtimeStatus) {
  if (statuses[role] === status) return
  statuses[role] = status
  for (const notify of watchers) notify()
}

const watch = (onChange: () => void) => {
  watchers.add(onChange)
  return () => {
    watchers.delete(onChange)
  }
}

/** The app's realtime connection: queries poll slowly while it is "connected". */
export function useRealtimeStatus(role: Role): RealtimeStatus {
  return useSyncExternalStore(
    watch,
    () => statuses[role],
    () => "off",
  )
}

/** Poll every `fallbackMs`, or every `connectedMs` while realtime delivers changes as they happen. */
export function useLiveInterval(role: Role, fallbackMs: number, connectedMs: number): number {
  return useRealtimeStatus(role) === "connected" ? connectedMs : fallbackMs
}

const depsFor = (role: Role): RealtimeDeps => ({
  config: () => realtimeApi.config(role),
  auth: (request) => realtimeApi.auth(role, request),
  // Loaded only when the server has keys, so the static build and polling-only setups skip it.
  loadPusher: async () => (await import("pusher-js")).default,
})

/** Keeps the signed-in app's realtime connection open while mounted: call it once, in the shell. */
export function useRealtime(role: Role, onEvent: (event: RealtimeEventName) => void) {
  const handle = useEffectEvent(onEvent)
  useEffect(() => {
    if (DATA_SOURCE !== "api") return
    return connectRealtime(
      depsFor(role),
      (event) => handle(event),
      (status) => setStatus(role, status),
    )
  }, [role])
}
