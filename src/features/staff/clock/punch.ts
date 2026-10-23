// Builds clock requests. There is no device GPS or camera provider yet (lib/platform comes later,
// OPEN_QUESTIONS H-series), so the `?sim=` scenario places the worker at a known distance from the
// venue and the selfie is a flag. The server still judges the position: the geofence verdict is
// never taken from the client (product spec §8.8).
import { offsetNorth } from "@/lib/geo/geofence"
import type { ClockPunchRequest, LocationSample } from "@/lib/data"

export const CLOCK_SIMS = ["inside", "outside", "offline", "denied"] as const
export type ClockSim = (typeof CLOCK_SIMS)[number]

/** Distances the demo scenarios stand at, from the design's copy ("420 m", "Inside · 38 m"). */
const SIM_DISTANCE_M = { inside: 38, offline: 38, denied: 38, outside: 420 } as const
const CLOCK_OUT_INSIDE_M = 41
const FIX_ACCURACY_M = 18

export function simulatedFix(
  sim: ClockSim,
  venue: { lat: number; lng: number },
  kind: "in" | "out" = "in",
): LocationSample {
  const meters = kind === "out" && sim !== "outside" ? CLOCK_OUT_INSIDE_M : SIM_DISTANCE_M[sim]
  return { ...offsetNorth(venue, meters), accuracyM: FIX_ACCURACY_M }
}

/** UUIDs need a secure context; a phone on the LAN over http gets a random fallback. */
function newKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

type PunchInput = {
  assignmentId: string
  location?: LocationSample
  selfie: boolean
  offline?: boolean
  requestApproval?: boolean
  note?: string
  /** Device time of the punch: the original time for an offline capture. */
  at?: Date
}

export function punchRequest(input: PunchInput): ClockPunchRequest {
  return {
    idempotencyKey: newKey(),
    assignmentId: input.assignmentId,
    deviceTimestamp: (input.at ?? new Date()).toISOString(),
    ...(input.location ? { location: input.location } : {}),
    selfie: input.selfie,
    offline: input.offline ?? false,
    ...(input.requestApproval ? { requestApproval: true } : {}),
    ...(input.note ? { note: input.note } : {}),
  }
}
