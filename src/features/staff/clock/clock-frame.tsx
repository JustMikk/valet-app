import type { ReactNode } from "react"

import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"

/**
 * Full-screen clock-in layer: edge to edge on phone, a 440 px card over a dimmed, blurred app from
 * 700 px (Staff PWA clockBack / clockCard).
 */
export function ClockFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-full tablet:grid tablet:animate-fade tablet:place-items-center tablet:clock-backdrop">
      <div className="relative h-full overflow-hidden bg-bg text-fg tablet:h-[min(800px,calc(100dvh-48px))] tablet:w-110 tablet:animate-sheet-up tablet:rounded-r32 tablet:shadow-clock">
        {children}
      </div>
    </div>
  )
}

/** One step's scrolling content column. */
export function ClockScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 box-border no-scrollbar flex animate-screen flex-col gap-5.5 overflow-x-hidden overflow-y-auto px-5 pt-[calc(var(--safe-top)+8px)] pb-8 tablet:pt-5 tablet:pb-6",
        className,
      )}
    >
      {children}
    </div>
  )
}

type ClockTopBarProps = {
  /** `close` leaves the flow, `back` returns to the previous step. */
  leading: "close" | "back"
  onLeading: () => void
  title?: string
}

/** 52 px glass control, a centered caption and a spacer that balances it. */
export function ClockTopBar({ leading, onLeading, title }: ClockTopBarProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label={leading === "close" ? "Close" : "Back"}
        onClick={onLeading}
        className="grid size-13 place-items-center rounded-pill border-0 glass text-fg transition-transform duration-160 active:scale-94"
      >
        <Icon name={leading === "close" ? "close" : "arrow_back"} size={24} />
      </button>
      <span className="text-14 font-medium text-fg-2">{title}</span>
      <span className="w-13" />
    </div>
  )
}

/** Big "result" circle with a pop-in and an optional ring burst (success / offline / done). */
export function ClockResultBadge({
  tone,
  icon,
  burst = false,
}: {
  tone: "ok" | "fg"
  icon: "check" | "cloud_off"
  burst?: boolean
}) {
  return (
    <div
      className={cn(
        "relative grid size-24 animate-pop place-items-center rounded-pill text-bg",
        tone === "ok" ? "bg-ok" : "bg-fg",
      )}
    >
      <Icon name={icon} weight={700} size={54} />
      {burst && (
        <div className="absolute inset-0 animate-ring-burst rounded-pill shadow-[0_0_0_3px_var(--ok)]" />
      )}
    </div>
  )
}
