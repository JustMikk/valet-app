import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { OnboardingScreen, STEP_BODY, STEP_TITLE } from "./onboarding-frame"

type DoneStepProps = { pushOn: boolean; onFinish: () => void }

/** "You're all set": what is on, and whether alerts were skipped. */
export function DoneStep({ pushOn, onFinish }: DoneStepProps) {
  return (
    <OnboardingScreen grow className="justify-center gap-6.5">
      <div className="grid size-24 animate-pop place-items-center rounded-pill bg-ok text-bg">
        <Icon name="check" weight={700} size={54} />
      </div>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-display text-40 leading-x105 font-bold tracking-n035">
          You&apos;re all set, Jordan.
        </h1>
        <p className={STEP_BODY}>
          {pushOn
            ? "Location, the app and notifications are on. Your first shift is tonight at The Grand Hotel."
            : "Notifications are off, so dispatch can’t alert you. You can turn them on any time in Profile."}
        </p>
      </div>
      <Button variant="strong" size="xl" className="text-18" onClick={onFinish}>
        See my shifts
      </Button>
    </OnboardingScreen>
  )
}

/** Desktop only: clock-in needs a phone's location and camera, so hand off with a QR code. */
export function DesktopStep({ onContinue }: { onContinue: () => void }) {
  return (
    <OnboardingScreen className="gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Continue on your phone</h1>
        <p className={STEP_BODY}>
          Clocking in needs your phone&apos;s location and camera. Scan this with your phone camera
          to finish setting up.
        </p>
      </div>
      <div className="flex items-center gap-5 rounded-r24 bg-surface p-5">
        <div
          role="img"
          aria-label="QR code placeholder"
          className="grid size-37 flex-none place-items-center rounded-r16 bg-white shadow-[inset_0_0_0_1px_var(--line)]"
        >
          <span className="font-mono text-11 text-fg-3-line">QR CODE</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-16 font-semibold">Or open the link we emailed you</span>
          <span className="text-14 leading-x140 text-fg-2">
            jordan.ellis@gmail.com · sent 2:02 PM
          </span>
        </div>
      </div>
      <Button variant="secondary" size="md" className="text-16" onClick={onContinue}>
        Continue here anyway
      </Button>
    </OnboardingScreen>
  )
}
