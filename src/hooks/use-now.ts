"use client"

import { useEffect, useState } from "react"

/** The current time in ms, refreshed every `intervalMs` (default 1 s). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
