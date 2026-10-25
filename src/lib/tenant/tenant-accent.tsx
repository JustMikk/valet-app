"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import { AccentHex, DEFAULT_ACCENT } from "./accent"
import { TenantTheme } from "./tenant-theme"

type TenantAccent = { accent: string; setAccent: (hex: string) => void }

const TenantAccentContext = createContext<TenantAccent | null>(null)

/**
 * Holds the tenant's accent and injects its CSS variables. `initial` is the tenant's saved color
 * (it follows the server when that changes); `setAccent` previews a different one at once, until
 * the saved color next changes. An invalid value is ignored.
 */
export function TenantAccentProvider({
  initial = DEFAULT_ACCENT,
  children,
}: {
  initial?: string
  children: ReactNode
}) {
  const saved = AccentHex.safeParse(initial).success ? AccentHex.parse(initial) : DEFAULT_ACCENT
  // A preview is remembered with the saved color it was made against, and dropped once that moves.
  const [preview, setPreview] = useState<{ hex: string; base: string } | null>(null)
  const accent = preview && preview.base === saved ? preview.hex : saved
  const value = useMemo<TenantAccent>(
    () => ({
      accent,
      setAccent: (hex) => {
        const parsed = AccentHex.safeParse(hex)
        if (parsed.success) setPreview({ hex: parsed.data, base: saved })
      },
    }),
    [accent, saved],
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
