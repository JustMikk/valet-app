"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type ShellMenu = { open: boolean; setOpen: (open: boolean) => void }

const ShellMenuContext = createContext<ShellMenu | null>(null)

/** Owns the phone "More" sheet state, so pages that draw their own top bar can open it. */
export function ShellMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ open, setOpen }), [open])
  return <ShellMenuContext.Provider value={value}>{children}</ShellMenuContext.Provider>
}

export function useShellMenu(): ShellMenu {
  const ctx = useContext(ShellMenuContext)
  if (!ctx) throw new Error("useShellMenu must be used inside AppShell")
  return ctx
}
