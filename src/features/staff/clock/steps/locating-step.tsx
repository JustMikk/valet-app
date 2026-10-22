import { Icon } from "@/components/shared"
import { CLOCK_VENUE } from "@/mocks/clock"

import { ClockScreen, ClockTopBar } from "../clock-frame"

/** Step 1 of 2: pulse rings while the (simulated) location reading narrows to ±18 m. */
export function LocatingStep({ accuracy, onClose }: { accuracy: number; onClose: () => void }) {
  return (
    <ClockScreen>
      <ClockTopBar leading="close" onLeading={onClose} title="Step 1 of 2 · Location" />
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="relative grid size-55 place-items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              // Rings are offset by 0.8 s so the pulse reads as a continuous ripple.
              style={{ animationDelay: `${i * 0.8}s` }}
              className="absolute inset-0 animate-pulse-ring rounded-pill bg-fg opacity-12"
            />
          ))}
          <div className="relative grid size-22 place-items-center rounded-pill bg-fg text-bg">
            <Icon name="my_location" filled size={40} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="m-0 font-display text-32 leading-x110 font-bold tracking-n030">
            Finding your location
          </h1>
          <p className="m-0 max-w-75 text-17 leading-x145 text-pretty text-fg-2">
            Hold still for a moment. Garages and covered drives can take longer.
          </p>
        </div>
        <div
          role="status"
          aria-live="polite"
          className="flex h-11 items-center gap-2.5 rounded-pill bg-surface px-4.5"
        >
          <span className="font-mono text-18 font-semibold tabular-nums">±{accuracy} m</span>
          <span className="text-15 text-fg-2">need ±{CLOCK_VENUE.neededAccuracyM} m</span>
        </div>
      </div>
      <span className="text-center text-14 leading-x140 text-fg-3">
        Location is read only now, at clock-in. It is not tracked during your shift.
      </span>
    </ClockScreen>
  )
}
