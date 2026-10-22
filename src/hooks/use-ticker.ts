"use client"

import { useEffect, useState } from "react"

/** Seconds elapsed since mount while `running`, starting from `start`. Resets when `start` changes. */
export function useTicker(running: boolean, start = 0): number {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => {
      clearInterval(id)
      setElapsed(0)
    }
  }, [running, start])
  return start + elapsed
}
