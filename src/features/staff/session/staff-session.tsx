"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { TONIGHT } from "@/mocks/staff"

/** Where the attendant is relative to tonight's shift. */
export type StaffMode = "before" | "due" | "onshift"
export type StaffBanner = "push" | "sync" | "install" | null

type StaffSession = {
  mode: StaffMode
  /** Seconds worked tonight; ticks while on shift. */
  secs: number
  banner: StaffBanner
  pushOn: boolean
  /** Clock-in succeeded: start the timer from zero. */
  clockIn: (opts?: { offline?: boolean }) => void
  /** Clock-out finished: back to "before" the next shift. */
  clockOut: () => void
  setBanner: (banner: StaffBanner) => void
  setPushOn: (on: boolean) => void
  /** Demo links (?mode=onshift) jump straight to a state. */
  jumpTo: (mode: StaffMode) => void
}

const StaffSessionContext = createContext<StaffSession | null>(null)

/** In-memory staff state for the demo. Replaced by repositories + the offline queue later. */
export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StaffMode>("due")
  const [secs, setSecs] = useState<number>(TONIGHT.demoElapsedSecs)
  const [banner, setBanner] = useState<StaffBanner>(null)
  const [pushOn, setPushOn] = useState(true)

  useEffect(() => {
    if (mode !== "onshift") return
    const tick = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(tick)
  }, [mode])

  const clockIn = useCallback((opts?: { offline?: boolean }) => {
    setMode("onshift")
    setSecs(0)
    setBanner(opts?.offline ? "sync" : null)
  }, [])
  const clockOut = useCallback(() => {
    setMode("before")
    setBanner(null)
  }, [])
  const jumpTo = useCallback((next: StaffMode) => {
    setMode(next)
    if (next === "onshift") setSecs(TONIGHT.demoElapsedSecs)
  }, [])

  const value = useMemo<StaffSession>(
    () => ({ mode, secs, banner, pushOn, clockIn, clockOut, setBanner, setPushOn, jumpTo }),
    [mode, secs, banner, pushOn, clockIn, clockOut, jumpTo],
  )
  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>
}

export function useStaffSession(): StaffSession {
  const session = useContext(StaffSessionContext)
  if (!session) throw new Error("useStaffSession must be used inside StaffSessionProvider")
  return session
}
