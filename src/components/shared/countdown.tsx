"use client"

import { useHydrated } from "@/hooks/use-hydrated"
import { useNow } from "@/hooks/use-now"
import { describeCountdown } from "@/lib/time/countdown"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type CountdownProps = {
  /** ISO instants from the API; with either missing there is nothing to count. */
  startsAt?: string
  endsAt?: string
  className?: string
}

/** "Starts in 1h 26m", then "In progress · 3h 10m left", from the phone's clock, minute by minute. */
export function Countdown({ startsAt, endsAt, className }: CountdownProps) {
  const hydrated = useHydrated()
  const now = useNow(30_000)
  const text = hydrated && startsAt && endsAt ? describeCountdown(startsAt, endsAt, now) : null
  if (!text) return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-14 font-semibold text-accent-text",
        className,
      )}
    >
      <Icon name="timer" size={18} />
      {text}
    </span>
  )
}
