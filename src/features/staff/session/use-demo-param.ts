"use client"

import { useSearchParams } from "next/navigation"

/**
 * Reads a demo override from the URL (?mode=onshift, ?sim=outside). Returns it only when it is one
 * of `allowed`, so a mistyped link falls back to the real session state. Components calling this
 * must render under a <Suspense> boundary (static export requirement for useSearchParams).
 */
export function useDemoParam<T extends string>(name: string, allowed: readonly T[]): T | null {
  const value = useSearchParams().get(name)
  return allowed.find((candidate) => candidate === value) ?? null
}
