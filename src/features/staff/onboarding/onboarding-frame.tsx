import type { ReactNode } from "react"

import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"

/**
 * Onboarding ground: edge to edge on phone; from 700 px a 480 px glass card over a soft accent
 * wash (Staff Onboarding outer / card).
 */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  return (
    <div className="box-border flex min-h-full w-full items-stretch justify-center tablet:items-center tablet:p-10 tablet:onboarding-glow">
      <div className="box-border flex min-h-full w-full flex-col gap-7 px-5 pt-[calc(var(--safe-top)+8px)] pb-8 tablet:min-h-180 tablet:max-w-120 tablet:rounded-r32 tablet:bg-sheet tablet:px-9 tablet:pt-8 tablet:pb-9 tablet:shadow-onboarding tablet:[backdrop-filter:var(--blur-lg)]">
        {children}
      </div>
    </div>
  )
}

type ProgressProps = {
  /** Index in the flow (1 = sign-in … 6 = push). */
  index: number
  onBack: () => void
}

/** Back button, six progress segments and "n of 6". */
export function OnboardingProgress({ index, onBack }: ProgressProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="grid size-12 flex-none place-items-center rounded-pill border-0 glass text-fg"
      >
        <Icon name="arrow_back" size={22} />
      </button>
      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={1}
        aria-valuemax={6}
        aria-valuenow={Math.min(index, 6)}
        className="flex flex-1 gap-1"
      >
        {Array.from({ length: 6 }, (_, k) => (
          <span
            key={k}
            className={cn(
              "h-1 flex-1 rounded-r9 transition-colors duration-300",
              k < index ? "bg-fg" : "bg-line",
            )}
          />
        ))}
      </div>
      <span className="w-12 text-right text-13 font-medium text-fg-2">
        {Math.min(index, 6)} of 6
      </span>
    </div>
  )
}

/** One step's content, entering with the screen transition. */
export function OnboardingScreen({
  children,
  grow = false,
  className,
}: {
  children: ReactNode
  /** Fill the card so trailing buttons sit at the bottom. */
  grow?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex animate-screen flex-col", grow && "flex-1", className)}>
      {children}
    </div>
  )
}

export const STEP_TITLE = "m-0 font-display text-36 leading-x105 font-bold tracking-n035 text-fg"
export const STEP_BODY = "m-0 text-17 leading-x150 text-fg-2"
