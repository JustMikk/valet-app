import Image from "next/image"

import { ActionButton, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { ClockVenueView } from "../clock-view"

type ConfirmStepProps = {
  venue: ClockVenueView
  /** The captured selfie (JPEG data URL); null for a simulated camera. */
  photo: string | null
  busy?: boolean
  onRetake: () => void
  onSubmit: () => void
}

const ROW = "box-content flex min-h-13.5 items-center border-b border-line"

/** Confirm sheet over the captured selfie: time, venue, location and selfie checks. */
export function ConfirmStep({ venue, photo, busy = false, onRetake, onSubmit }: ConfirmStepProps) {
  return (
    <div className="absolute inset-0 camera-bg-confirm">
      {/* The camera flash replays each time the step mounts. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-5 animate-flash bg-white"
      />
      <div className="absolute top-27.5 left-1/2 -ml-25 grid h-65 w-50 place-items-center rounded-[50%] camera-oval-soft tablet:top-15">
        {photo ? (
          <Image
            src={photo}
            alt="Your selfie"
            fill
            unoptimized
            className="-scale-x-100 rounded-[50%] object-cover"
          />
        ) : (
          <span className="font-mono text-12 tracking-p060 text-white/50">SELFIE CAPTURED</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex animate-sheet-up-slow flex-col gap-4 rounded-t-sheet bg-sheet px-5 pt-3 pb-7 text-fg [backdrop-filter:var(--blur-lg)]">
        <span aria-hidden="true" className="h-1.25 w-10 self-center rounded-r9 bg-line" />
        <div className="flex flex-col gap-1.5">
          <span className="text-15 font-medium text-fg-2">Clock in at</span>
          <span className="font-display text-48 leading-x100 font-bold tracking-n040">
            {venue.clockInTime}
          </span>
        </div>
        <div className="flex flex-col border-t border-line">
          <div className={ROW}>
            <span className="flex-1 text-17">{venue.name}</span>
            <span className="text-15 text-fg-2">{venue.hours}</span>
          </div>
          <div className={ROW}>
            <span className="flex-1 text-17">Location</span>
            <span className="inline-flex items-center gap-1.25 text-15 font-semibold text-ok">
              <Icon name="verified" filled size={20} />
              Inside · {venue.distanceM} m
            </span>
          </div>
          <div className={ROW}>
            <span className="flex-1 text-17">Selfie</span>
            <span className="inline-flex items-center gap-1.25 text-15 font-semibold text-ok">
              <Icon name="check_circle" filled size={20} />
              Captured
            </span>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1 px-1.5" onClick={onRetake}>
            Retake
          </Button>
          <ActionButton
            variant="accent"
            size="lg"
            icon="login"
            shine
            className="flex-2 px-1.5 text-18"
            disabled={busy}
            onClick={onSubmit}
          >
            Clock in
          </ActionButton>
        </div>
      </div>
    </div>
  )
}
