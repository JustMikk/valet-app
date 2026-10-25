import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { ClockScreen, ClockTopBar } from "../clock-frame"
import type { ClockVenueView } from "../clock-view"

type OutsideStepProps = {
  venue: ClockVenueView
  onClose: () => void
  onRetry: () => void
  onRequestApproval: () => void
}

/** Outside the geofence: distance, a "not live" snapshot map, retry or request approval. */
export function OutsideStep({ venue, onClose, onRetry, onRequestApproval }: OutsideStepProps) {
  return (
    <ClockScreen>
      <ClockTopBar leading="close" onLeading={onClose} title="Step 1 of 2 · Location" />
      <div className="flex animate-rise flex-col gap-3">
        <StatusBadge
          className="self-start"
          status={{
            tone: "warn",
            icon: "wrong_location",
            filled: true,
            label: "Outside the venue area",
          }}
        />
        <span className="font-display text-60 leading-x100 font-bold tracking-n045">
          {venue.distanceM} m
        </span>
        <span className="text-18 leading-x140 text-pretty text-fg-2">
          from {venue.name}. You need to be within {venue.radiusM} m to clock in.
        </span>
      </div>
      <div
        role="img"
        aria-label="Snapshot map: you are outside the venue area"
        className="relative h-50 flex-none overflow-hidden rounded-card bg-surface"
      >
        <div className="absolute top-7.5 left-[18%] size-35 rounded-pill bg-ok-soft shadow-[inset_0_0_0_2px_var(--ok)]" />
        <div className="absolute top-23 left-[calc(18%+62px)] size-4 rounded-r4 bg-fg" />
        <div className="absolute top-11.5 right-[16%] size-5.5 rounded-pill bg-warn shadow-[0_0_0_6px_var(--warn-soft)]" />
        <span className="absolute top-20 right-[10%] text-12 font-semibold">
          You · {venue.requestTime}
        </span>
        <span className="absolute bottom-3 left-4 text-12 font-medium text-fg-3">
          Snapshot at this moment · ±18 m · not live
        </span>
      </div>
      <span className="text-15 leading-x145 text-fg-2">
        Just arrived? Walk to the entrance and try again. If you&apos;re at the right place (garages
        often confuse GPS), ask your manager to approve it.
      </span>
      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="strong" size="lg" className="text-18" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" size="lg" className="text-18" onClick={onRequestApproval}>
          Request approval
        </Button>
      </div>
    </ClockScreen>
  )
}
