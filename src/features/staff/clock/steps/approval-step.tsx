import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CLOCK_NOTE_PRESETS, CLOCK_VENUE } from "@/mocks/clock"

import { ClockScreen, ClockTopBar } from "../clock-frame"

type ApprovalStepProps = {
  note: string
  onNote: (note: string) => void
  onBack: () => void
  onRetake: () => void
  onSend: () => void
}

/** Request approval: selfie recap, a "where are you" note, send. Time counts from the request. */
export function ApprovalStep({ note, onNote, onBack, onRetake, onSend }: ApprovalStepProps) {
  return (
    <ClockScreen>
      <ClockTopBar leading="back" onLeading={onBack} title="Request approval" />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-32 leading-x110 font-bold tracking-n030">
          Ask your manager to clock you in
        </h1>
        <p className="m-0 text-16 leading-x145 text-fg-2">
          We&apos;ll send your selfie, this location snapshot and your note. If approved, your time
          starts from <b className="text-fg">now ({CLOCK_VENUE.requestTime})</b>, not when they
          reply.
        </p>
      </div>
      <div className="flex items-center gap-3.5 rounded-r20 bg-surface p-3.5">
        <div className="grid h-20 w-16 flex-none place-items-center rounded-r14 text-white/60 selfie-thumb">
          <Icon name="face" filled size={26} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-16 font-semibold">Selfie captured</span>
          <span className="text-14 text-fg-2">420 m from venue · ±18 m</span>
        </div>
        <Button variant="elevated" size="xs" className="h-10 px-3.5 text-14" onClick={onRetake}>
          Retake
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-15 font-medium">Where are you?</span>
        <div role="group" aria-label="Where are you?" className="flex flex-wrap gap-2">
          {CLOCK_NOTE_PRESETS.map((preset) => {
            const on = note === (preset === "Other" ? "" : preset)
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={on}
                onClick={() => onNote(preset === "Other" ? "" : preset)}
                className={cn(
                  "h-10 rounded-r10 border-0 px-3.5 text-15 transition-colors duration-200",
                  on
                    ? "bg-accent-soft font-semibold text-accent-text shadow-[inset_0_0_0_1.5px_var(--accent)]"
                    : "bg-surface font-medium text-fg-2",
                )}
              >
                {preset}
              </button>
            )
          })}
        </div>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          aria-label="Note for your manager"
          placeholder="Add a short note"
          className="field-sizing-fixed min-h-0 shadow-[inset_0_0_0_1.5px_var(--line)]"
        />
      </div>
      <div className="mt-auto">
        <Button variant="accent" size="lg" className="w-full text-18" onClick={onSend}>
          Send request
        </Button>
      </div>
    </ClockScreen>
  )
}
