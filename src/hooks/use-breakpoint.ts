"use client"

import { useSyncExternalStore } from "react"

/** Layout breakpoints from SCREENS.md: phone < 700 px, tablet 700–1099 px, desktop ≥ 1100 px. */
export type Breakpoint = "phone" | "tablet" | "desktop"

const TABLET_QUERY = "(min-width: 700px)"
const DESKTOP_QUERY = "(min-width: 1100px)"

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(TABLET_QUERY), window.matchMedia(DESKTOP_QUERY)]
  queries.forEach((q) => q.addEventListener("change", onChange))
  return () => queries.forEach((q) => q.removeEventListener("change", onChange))
}

function getSnapshot(): Breakpoint {
  if (window.matchMedia(DESKTOP_QUERY).matches) return "desktop"
  if (window.matchMedia(TABLET_QUERY).matches) return "tablet"
  return "phone"
}

/** Current layout breakpoint. The static prerender renders "phone" (mobile first). */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getSnapshot, () => "phone")
}
