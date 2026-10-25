"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * False on the server and during hydration, true afterwards. Screens that branch on cached data
 * render their loading state until then, so the first client render always matches the prerendered
 * HTML (a Suspense subtree can hydrate after data is already in the cache).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
