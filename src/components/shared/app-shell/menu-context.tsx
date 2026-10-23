"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type ShellMenu = {
  /** The phone "More" sheet. */
  open: boolean
  setOpen: (open: boolean) => void
  /** The notification drawer. */
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
}

const ShellMenuContext = createContext<ShellMenu | null>(null)

/**
 * Owns the phone "More" sheet and the notification drawer, so pages that draw their own top bar
 * (the Live Board, the staff inbox) can open them.
 */
export function ShellMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const value = useMemo(
    () => ({ open, setOpen, notificationsOpen, setNotificationsOpen }),
    [open, notificationsOpen],
  )
  return <ShellMenuContext.Provider value={value}>{children}</ShellMenuContext.Provider>
}

export function useShellMenu(): ShellMenu {
  const ctx = useContext(ShellMenuContext)
  if (!ctx) throw new Error("useShellMenu must be used inside AppShell")
  return ctx
}
