import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { doneContent, type ClockStep } from "@/mocks/clock"

import { ClockResultBadge, ClockScreen } from "../clock-frame"

type DoneStepProps = {
  step: Extract<ClockStep, "success" | "offline" | "outdone">
  /** "2h 14m" worked, for the clock-out summary. */
  workedLabel: string
  onDone: () => void
}

/** Result of clock-in (online or saved offline) or clock-out. */
export function DoneStep({ step, workedLabel, onDone }: DoneStepProps) {
  const done = doneContent(step, workedLabel)
  return (
    <ClockScreen>
      <div className="flex flex-1 flex-col justify-center gap-6.5">
        {/* Keyed by step so the pop and ring burst replay for each result. */}
        <ClockResultBadge
          key={step}
          tone={step === "offline" ? "fg" : "ok"}
          icon={step === "offline" ? "cloud_off" : "check"}
          burst
        />
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-40 leading-x105 font-bold tracking-n035">
            {done.title}
          </h1>
          <p className="m-0 text-18 leading-x145 text-fg-2">{done.body}</p>
        </div>
        {done.pending && (
          <div
            role="status"
            className="flex min-h-12 items-center gap-2 rounded-pill bg-surface px-4 text-15 font-semibold"
          >
            <Icon name="sync" size={20} className="animate-spin-slow text-fg-2" />
            Saved on this phone · waiting to sync
          </div>
        )}
        <div className="flex flex-col border-t border-line">
          {done.rows.map((row) => (
            <div
              key={row.k}
              className="box-content flex min-h-14 items-center border-b border-line"
            >
              <span className="flex-1 text-17">{row.k}</span>
              <span className="text-17 font-semibold">{row.v}</span>
            </div>
          ))}
        </div>
      </div>
      <Button variant="strong" size="lg" className="text-18" onClick={onDone}>
        Done
      </Button>
    </ClockScreen>
  )
}
