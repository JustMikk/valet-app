"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { DATA_SOURCE } from "@/lib/data"
import type { Role } from "@/lib/data/api-client"
import { pushApi } from "@/lib/data/push-client"
import { unsupportedPush, webPush } from "@/lib/platform"

/**
 * Where this device stands on push: `unavailable` (browser or build can't), `unconfigured` (server
 * has no key), `blocked` (the user said no in the browser), `off`, or `on`.
 */
export type PushStatus = "unavailable" | "unconfigured" | "blocked" | "off" | "on"

// The static (fixture) build has no server to push from.
const provider = DATA_SOURCE === "api" ? webPush : unsupportedPush

async function readStatus(): Promise<PushStatus> {
  const permission = provider.permission()
  if (permission === "unsupported") return "unavailable"
  if (!(await pushApi.config()).publicKey) return "unconfigured"
  if (permission === "denied") return "blocked"
  return permission === "granted" && (await provider.current()) ? "on" : "off"
}

/** Push on this device for one app's session: its state, and turning it on or off. */
export function usePush(role: Role) {
  const queryClient = useQueryClient()
  const key = ["push-status", role]
  const status = useQuery({ queryKey: key, queryFn: readStatus, staleTime: Infinity })
  const set = (next: PushStatus) => queryClient.setQueryData(key, next)

  const enable = useMutation({
    mutationFn: async (): Promise<PushStatus> => {
      const { publicKey } = await pushApi.config()
      if (!publicKey) return "unconfigured"
      const outcome = await provider.subscribe(publicKey)
      if (!outcome.ok) {
        if (outcome.reason === "denied") return "blocked"
        throw new Error("Couldn't turn on notifications on this device. Try again.")
      }
      await pushApi.subscribe(role, outcome.subscription)
      return "on"
    },
    onSuccess: set,
  })

  const disable = useMutation({
    mutationFn: async (): Promise<PushStatus> => {
      const endpoint = await provider.unsubscribe()
      if (endpoint) await pushApi.unsubscribe(role, endpoint)
      return "off"
    },
    onSuccess: set,
  })

  return { status: status.data ?? "unavailable", loading: status.isPending, enable, disable }
}
