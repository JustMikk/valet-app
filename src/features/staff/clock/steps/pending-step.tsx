import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { formatMinutesSeconds } from "@/lib/time/duration"

import { ClockScreen } from "../clock-frame"
import type { ClockVenueView } from "../clock-view"

type PendingStepProps = {
  venue: ClockVenueView
  waitSecs: number
  note: string
  onSimulateApproval: () => void
}

const ROW = "box-content flex min-h-14 items-center border-b border-line"

/** Waiting for approval: spinner, running wait time, and the note that was sent. */
export function PendingStep({ venue, waitSecs, note, onSimulateApproval }: PendingStepProps) {
  return (
    <ClockScreen>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="relative grid size-24 place-items-center">
          <div
            aria-hidden="true"
            className="absolute -inset-2 animate-spin-medium rounded-pill border-3 border-info border-t-transparent"
          />
          <div className="grid size-24 place-items-center rounded-pill bg-info-soft text-info">
            <Icon name="hourglass_top" filled size={46} />
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 font-display text-36 leading-x105 font-bold tracking-n035">
            Waiting for approval
          </h1>
          <p className="m-0 text-17 leading-x145 text-fg-2">
            Sent to dispatch at {venue.requestTime}. If approved, you&apos;re on the clock from{" "}
            {venue.requestTime}. We&apos;ll notify you either way.
          </p>
        </div>
        <div className="flex flex-col border-t border-line">
          <div className={ROW}>
            <span className="flex-1 text-17">Waiting</span>
            <span className="font-mono text-17 font-semibold" role="timer">
              {formatMinutesSeconds(waitSecs)}
            </span>
          </div>
          <div className={ROW}>
            <span className="flex-1 text-17">Your note</span>
            <span className="text-16 font-semibold">{note || "—"}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <Button variant="secondary" onClick={onSimulateApproval}>
          Message dispatch
        </Button>
        <span className="text-center text-13 text-fg-3">
          Prototype: tap above to simulate an approval
        </span>
      </div>
    </ClockScreen>
  )
}
