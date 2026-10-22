"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useBreakpoint } from "@/hooks/use-breakpoint"
import { ONBOARDING_ORDER, type InstallOs, type OnboardingStep } from "@/mocks/onboarding"

import { useStaffSession } from "../session/staff-session"
import { useDemoParam } from "../session/use-demo-param"
import { DesktopStep, DoneStep } from "./finish-steps"
import { CodeStep, InviteStep, ProfileStep, SigninStep } from "./intro-steps"
import { OnboardingFrame, OnboardingProgress } from "./onboarding-frame"
import { InstallStep, LocationStep, PushStep } from "./permission-steps"

const ALL_STEPS: readonly OnboardingStep[] = [...ONBOARDING_ORDER, "desktop"]

/**
 * Invite-to-ready setup. Every permission is simulated; `?step=` jumps to a screen. On desktop the
 * invite hands off to a "continue on your phone" screen first.
 */
export function OnboardingFlow() {
  const router = useRouter()
  const session = useStaffSession()
  const breakpoint = useBreakpoint()
  const initial = useDemoParam("step", ALL_STEPS) ?? "invite"

  const [step, setStep] = useState<OnboardingStep>(initial)
  const [os, setOs] = useState<InstallOs>("ios")

  const go = (next: OnboardingStep) => setStep(next)
  const afterInvite = () => go(breakpoint === "desktop" ? "desktop" : "signin")
  const finish = () => router.replace("/staff")

  // Sign-in is step 1 of 6, push is step 6.
  const index = ONBOARDING_ORDER.indexOf(step as (typeof ONBOARDING_ORDER)[number])
  const showProgress = index >= 1 && step !== "done"
  const back = () => {
    const prev = ONBOARDING_ORDER[index - 1]
    if (prev) go(prev)
  }

  return (
    <OnboardingFrame>
      {showProgress && <OnboardingProgress index={index} onBack={back} />}
      {step === "invite" && <InviteStep onNext={afterInvite} />}
      {step === "desktop" && <DesktopStep onContinue={() => go("signin")} />}
      {step === "signin" && <SigninStep onNext={() => go("code")} />}
      {step === "code" && <CodeStep onNext={() => go("profile")} />}
      {step === "profile" && <ProfileStep onNext={() => go("location")} />}
      {step === "location" && <LocationStep onNext={() => go("install")} />}
      {step === "install" && <InstallStep os={os} onOs={setOs} onNext={() => go("push")} />}
      {step === "push" && (
        <PushStep
          onAllow={() => {
            session.setPushOn(true)
            go("done")
          }}
          onSkip={() => {
            session.setPushOn(false)
            go("done")
          }}
        />
      )}
      {step === "done" && <DoneStep pushOn={session.pushOn} onFinish={finish} />}
    </OnboardingFrame>
  )
}
