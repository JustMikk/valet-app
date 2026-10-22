import Image from "next/image"

import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { INSTALL_STEPS, LOCATION_PROMISES, type InstallOs } from "@/mocks/onboarding"

import { OnboardingScreen, STEP_BODY, STEP_TITLE } from "./onboarding-frame"

const CTA = "text-18"
const SKIP = "h-12 text-15 text-fg-2"

/** Why location is needed, and a promise list; allowing is simulated until the provider exists. */
export function LocationStep({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingScreen grow className="gap-5.5">
      <div className="grid size-18 place-items-center rounded-r22 bg-accent-soft text-accent-text">
        <Icon name="location_on" filled size={36} />
      </div>
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Location, only at clock-in</h1>
        <p className={STEP_BODY}>
          When you tap Clock in or Clock out, the app checks once that you&apos;re at the venue. It
          does not track you during shifts or any other time.
        </p>
      </div>
      <ul className="m-0 flex list-none flex-col border-t border-line p-0">
        {LOCATION_PROMISES.map((promise) => (
          <li
            key={promise}
            className="box-content flex min-h-14 items-center gap-3 border-b border-line text-16"
          >
            <Icon name="check" size={22} className="text-ok" />
            {promise}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="accent" size="xl" className={CTA} onClick={onNext}>
          Allow location
        </Button>
        <Button variant="ghost" className={SKIP} onClick={onNext}>
          Not now (you won&apos;t be able to clock in)
        </Button>
      </div>
    </OnboardingScreen>
  )
}

type InstallStepProps = {
  os: InstallOs
  onOs: (os: InstallOs) => void
  onNext: () => void
}

const OS_TABS: { key: InstallOs; label: string }[] = [
  { key: "ios", label: "iPhone" },
  { key: "android", label: "Android" },
]

/** Add-to-Home-Screen guide with an iPhone / Android switch. */
export function InstallStep({ os, onOs, onNext }: InstallStepProps) {
  return (
    <OnboardingScreen grow className="gap-5.5">
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Add Regency to your Home Screen</h1>
        <p className={STEP_BODY}>
          On iPhone, shift alerts only work once the app is installed. It takes 10 seconds.
        </p>
      </div>
      <div
        role="group"
        aria-label="Device"
        className="flex gap-1.5 self-start rounded-pill bg-surface p-1"
      >
        {OS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={os === tab.key}
            onClick={() => onOs(tab.key)}
            className={cn(
              "h-10 rounded-pill border-0 px-4.5 text-15 font-semibold transition-[background-color,box-shadow] duration-200",
              os === tab.key ? "bg-elev text-fg shadow-float" : "bg-transparent text-fg-2",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ol key={os} className="m-0 flex list-none flex-col gap-2.5 p-0">
        {INSTALL_STEPS[os].map((step) => (
          <li
            key={step.n}
            className="flex animate-rise items-center gap-3.5 rounded-r20 glass-card p-3.5"
          >
            <div className="grid size-12 flex-none place-items-center rounded-r14 bg-elev text-info shadow-[inset_0_0_0_1px_var(--line)]">
              <Icon name={step.icon} size={26} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-13 font-semibold text-fg-3">STEP {step.n}</span>
              <span className="text-16 leading-x135 font-medium">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="accent" size="xl" className={CTA} onClick={onNext}>
          I&apos;ve added it
        </Button>
        <Button variant="ghost" className={SKIP} onClick={onNext}>
          Remind me later
        </Button>
      </div>
    </OnboardingScreen>
  )
}

type PushStepProps = { onAllow: () => void; onSkip: () => void }

/** Notification primer with a sample push card. */
export function PushStep({ onAllow, onSkip }: PushStepProps) {
  return (
    <OnboardingScreen grow className="gap-5.5">
      <div className="flex animate-sheet-up items-start gap-3 rounded-r22 glass p-4 [animation-delay:200ms] [animation-duration:500ms]">
        <div className="grid size-10 flex-none place-items-center rounded-r10 bg-white shadow-[inset_0_0_0_1px_var(--line)]">
          <Image
            src="/brand/regency-logo.png"
            alt=""
            width={34}
            height={19}
            className="h-auto w-8.5"
          />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-15 font-semibold">New shift · 3 spots</span>
          <span className="text-14 leading-x135 text-fg-2">
            The Grand Hotel, Sat 6–11 PM. Tap to claim.
          </span>
        </div>
        <span className="text-12 font-medium text-fg-3">now</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Turn on notifications</h1>
        <p className={STEP_BODY}>
          So you hear about new shifts, changes and messages from dispatch. There are no text
          messages, so this is how we reach you.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="accent" size="xl" className={CTA} onClick={onAllow}>
          Turn on notifications
        </Button>
        <Button variant="ghost" className={SKIP} onClick={onSkip}>
          Not now (I may miss shifts)
        </Button>
      </div>
    </OnboardingScreen>
  )
}
