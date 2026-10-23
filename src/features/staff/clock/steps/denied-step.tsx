import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { CAMERA_FIX_STEPS, LOCATION_FIX_STEPS } from "@/mocks/clock"

import { ClockScreen, ClockTopBar } from "../clock-frame"

const COPY = {
  location: {
    icon: "location_disabled",
    title: "Turn on location to clock in",
    body: "We check your location once, when you tap Clock in, to confirm you're at the venue. It is never tracked otherwise.",
    steps: LOCATION_FIX_STEPS,
  },
  camera: {
    icon: "photo_camera",
    title: "Turn on the camera to clock in",
    body: "We take one live selfie when you clock in, to confirm it's you. You can't clock in without it.",
    steps: CAMERA_FIX_STEPS,
  },
} as const

type DeniedStepProps = { kind?: "location" | "camera"; onClose: () => void; onRetry: () => void }

/** A device permission is off: why it is needed and three steps to turn it on. */
export function DeniedStep({ kind = "location", onClose, onRetry }: DeniedStepProps) {
  const copy = COPY[kind]
  return (
    <ClockScreen>
      <ClockTopBar leading="close" onLeading={onClose} />
      <div className="flex flex-col gap-3.5">
        <div className="grid size-16 place-items-center rounded-r20 bg-warn-soft text-warn">
          <Icon name={copy.icon} filled size={32} />
        </div>
        <h1 className="m-0 font-display text-32 leading-x110 font-bold tracking-n030">
          {copy.title}
        </h1>
        <p className="m-0 text-17 leading-x145 text-fg-2">{copy.body}</p>
      </div>
      <ol className="m-0 flex list-none flex-col rounded-r20 bg-surface px-4 py-1.5">
        {copy.steps.map((s) => (
          <li
            key={s.n}
            className="box-content flex min-h-13 items-center gap-3 border-b border-line"
          >
            <span className="grid size-6.5 flex-none place-items-center rounded-pill bg-fg text-13 font-bold text-bg">
              {s.n}
            </span>
            <span className="text-16 leading-x135">{s.text}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto">
        <Button variant="strong" size="lg" className="w-full text-18" onClick={onRetry}>
          I&apos;ve turned it on · try again
        </Button>
      </div>
    </ClockScreen>
  )
}
