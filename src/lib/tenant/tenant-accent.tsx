"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import { AccentHex, DEFAULT_ACCENT } from "./accent"
import { TenantTheme } from "./tenant-theme"

type TenantAccent = { accent: string; setAccent: (hex: string) => void }

const TenantAccentContext = createContext<TenantAccent | null>(null)

/**
 * Holds the tenant's accent and injects its CSS variables, so Settings can recolor the app live.
 * The accent lives in memory until the tenant API exists; an invalid value is ignored.
 */
export function TenantAccentProvider({
  initial = DEFAULT_ACCENT,
  children,
}: {
  initial?: string
  children: ReactNode
}) {
  const [accent, setAccentState] = useState<string>(AccentHex.parse(initial))
  const value = useMemo<TenantAccent>(
    () => ({
      accent,
      setAccent: (hex) => {
        const parsed = AccentHex.safeParse(hex)
        if (parsed.success) setAccentState(parsed.data)
      },
    }),
    [accent],
  )
  return (
    <TenantAccentContext.Provider value={value}>
      <TenantTheme accent={accent} />
      {children}
    </TenantAccentContext.Provider>
  )
}

export function useTenantAccent(): TenantAccent {
  const ctx = useContext(TenantAccentContext)
  if (!ctx) throw new Error("useTenantAccent must be used inside TenantAccentProvider")
  return ctx
}
