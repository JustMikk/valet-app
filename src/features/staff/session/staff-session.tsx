"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { enqueuePunch, flushPunches, queuedCount, type QueuedPunch } from "../clock/offline-queue"
import { keys } from "../data/queries"

const SYNC_DELAY_MS = 4000
const RETRY_DELAY_MS = 8000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

type StaffSession = {
  /** A punch is saved on this phone and waiting to sync (shows the "will sync" banner). */
  syncPending: boolean
  /** Original time of an offline clock-in not yet confirmed by the server: shown as on the clock. */
  pendingClockInAt: number | null
  queuePunch: (punch: QueuedPunch) => void
}

const StaffSessionContext = createContext<StaffSession | null>(null)

/** Query cache plus the offline punch queue for the staff app. */
export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1 } } }),
  )
  // A queue left over from a previous visit starts out pending and syncs on this load.
  const [syncPending, setSyncPending] = useState(() => queuedCount() > 0)
  const [pendingClockInAt, setPendingClockInAt] = useState<number | null>(null)
  const running = useRef(false)
  const unmounted = useRef(false)

  /** One loop at a time: wait, send what is queued, retry with a longer wait until it is empty. */
  const startSync = useCallback(() => {
    if (running.current) return
    running.current = true
    void (async () => {
      let delay = SYNC_DELAY_MS
      while (!unmounted.current) {
        await sleep(delay)
        const { remaining } = await flushPunches()
        await client.invalidateQueries({ queryKey: keys.home })
        if (remaining === 0) break
        delay = RETRY_DELAY_MS
      }
      running.current = false
      if (!unmounted.current) {
        setSyncPending(false)
        setPendingClockInAt(null)
      }
    })()
  }, [client])

  useEffect(() => {
    unmounted.current = false
    if (queuedCount() > 0) startSync()
    return () => {
      unmounted.current = true
    }
  }, [startSync])

  const queuePunch = useCallback(
    (punch: QueuedPunch) => {
      enqueuePunch(punch)
      if (punch.kind === "in") setPendingClockInAt(new Date(punch.req.deviceTimestamp).getTime())
      setSyncPending(true)
      startSync()
    },
    [startSync],
  )

  const value = useMemo<StaffSession>(
    () => ({ syncPending, pendingClockInAt, queuePunch }),
    [syncPending, pendingClockInAt, queuePunch],
  )
  return (
    <QueryClientProvider client={client}>
      <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>
    </QueryClientProvider>
  )
}

export function useStaffSession(): StaffSession {
  const session = useContext(StaffSessionContext)
  if (!session) throw new Error("useStaffSession must be used inside StaffSessionProvider")
  return session
}

/** Banner kinds on Home (also selectable with the ?banner= demo link). */
export type StaffBanner = "push" | "sync" | "install" | null
