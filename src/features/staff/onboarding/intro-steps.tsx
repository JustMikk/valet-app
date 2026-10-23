import { useEffect, useRef, useState } from "react"
import Image from "next/image"

import { Icon, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { staffRepo } from "@/lib/data"
import { cn } from "@/lib/utils"
import { ONBOARDING_INVITE } from "@/mocks/onboarding"
import { STAFF_USER } from "@/mocks/staff"

import { ErrorNotice } from "../data/query-state"
import { useProfile } from "../data/queries"
import { OnboardingScreen, STEP_BODY, STEP_TITLE } from "./onboarding-frame"

const CTA = "text-18"

export function InviteStep({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingScreen grow className="justify-center gap-7">
      <div className="grid size-30 place-items-center rounded-r32 bg-white logo-tile-glow">
        <Image
          src="/brand/regency-logo.png"
          alt="Regency Parking Service"
          width={100}
          height={56}
          className="h-auto w-25"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-44 leading-x102 font-bold tracking-n040">
          {ONBOARDING_INVITE.company} invited you to join their crew.
        </h1>
        <p className={STEP_BODY}>
          See your shifts, claim open ones, clock in at the venue, and chat with dispatch, all in
          one app.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Button variant="accent" size="xl" className={CTA} onClick={onNext}>
          Get started
        </Button>
        <span className="text-center text-13 text-fg-3">
          Invited as {STAFF_USER.email} by {ONBOARDING_INVITE.invitedBy}
        </span>
      </div>
    </OnboardingScreen>
  )
}

type SigninStepProps = { email: string; onEmail: (email: string) => void; onNext: () => void }

export function SigninStep({ email, onEmail, onNext }: SigninStepProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await staffRepo.requestCode(email.trim())
      onNext()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <OnboardingScreen className="gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Sign in with your email</h1>
        <p className={STEP_BODY}>
          We&apos;ll email you a 6-digit code. No password to remember, and it works on a new phone
          too.
        </p>
      </div>
      <TextField
        label="Email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        type="email"
        autoComplete="email"
      />
      {error && <ErrorNotice message={error} />}
      <Button
        variant="accent"
        size="xl"
        className={CTA}
        disabled={busy || !email.trim()}
        onClick={send}
      >
        Email me a code
      </Button>
    </OnboardingScreen>
  )
}

/** Six boxes that fill in one digit at a time when "Paste code from email" is tapped. */
export function CodeStep({ email, onNext }: { email: string; onNext: () => void }) {
  const [typed, setTyped] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const verify = async () => {
    setBusy(true)
    setError(null)
    try {
      await staffRepo.verifyCode(email.trim(), ONBOARDING_INVITE.code)
      onNext()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify the code. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const run = () => {
    if (typed >= 6) return void verify()
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setTyped((n) => {
        if (n >= 5 && timer.current) clearInterval(timer.current)
        return Math.min(6, n + 1)
      })
    }, 90)
  }

  return (
    <OnboardingScreen className="gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className={STEP_TITLE}>Enter the code</h1>
        <p className={STEP_BODY}>Sent to {email}. It expires in 10 minutes.</p>
      </div>
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="Six digit code">
        {ONBOARDING_INVITE.code.split("").map((digit, k) => (
          <span
            key={k}
            className={cn(
              "grid h-16 place-items-center rounded-r16 bg-surface font-display text-28 font-bold transition-shadow duration-150",
              k === typed && "shadow-[inset_0_0_0_2px_var(--fg)]",
              k < typed && "shadow-[inset_0_0_0_1.5px_var(--line)]",
            )}
          >
            {k < typed ? digit : ""}
          </span>
        ))}
      </div>
      {error && <ErrorNotice message={error} />}
      <Button variant="accent" size="xl" className={CTA} disabled={busy} onClick={run}>
        {typed >= 6 ? "Verify" : "Paste code from email"}
      </Button>
      <Button variant="ghost" size="compact" className="text-15 text-fg-2">
        Resend code
      </Button>
    </OnboardingScreen>
  )
}

export function ProfileStep({ onNext }: { onNext: () => void }) {
  const profile = useProfile().data
  return (
    <OnboardingScreen className="gap-5.5">
      <h1 className={STEP_TITLE}>Confirm your profile</h1>
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="grid size-22 place-items-center rounded-pill bg-surface text-fg-2 shadow-[inset_0_0_0_2px_var(--line)]"
        >
          <Icon name="add_a_photo" size={34} />
        </div>
        <span className="flex-1 text-15 leading-x145 text-fg-2">
          Optional photo. It helps dispatch recognise you on the board.
        </span>
      </div>
      <TextField
        label="Full name"
        defaultValue={profile?.name ?? STAFF_USER.name}
        readOnly
        autoComplete="name"
      />
      <TextField
        label="Phone (for dispatch to call)"
        defaultValue={profile?.phone ?? STAFF_USER.phone}
        readOnly
        type="tel"
        autoComplete="tel"
      />
      <Button variant="accent" size="xl" className={CTA} onClick={onNext}>
        Continue
      </Button>
    </OnboardingScreen>
  )
}
