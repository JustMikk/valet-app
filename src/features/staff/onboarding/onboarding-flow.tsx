"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useBreakpoint } from "@/hooks/use-breakpoint"
import { usePush } from "@/hooks/use-push"
import type { StaffProfile } from "@/lib/data"
import { ONBOARDING_ORDER, type InstallOs, type OnboardingStep } from "@/mocks/onboarding"
import { STAFF_USER } from "@/mocks/staff"

import { useProfile, useUpdateProfile } from "../data/queries"
import { useDemoParam } from "../session/use-demo-param"
import { DesktopStep, DoneStep } from "./finish-steps"
import { CodeStep, InviteStep, ProfileStep, SigninStep } from "./intro-steps"
import { OnboardingFrame, OnboardingProgress } from "./onboarding-frame"
import { InstallStep, LocationStep, PushStep } from "./permission-steps"

const ALL_STEPS: readonly OnboardingStep[] = [...ONBOARDING_ORDER, "desktop"]

/**
 * Invite-to-ready setup. Location and install are simulated; notifications are real where the
 * browser and server support push. `?step=` jumps to a screen. On desktop the
 * invite hands off to a "continue on your phone" screen first.
 */
export function OnboardingFlow() {
  const router = useRouter()
  const profile = useProfile().data
  const update = useUpdateProfile()
  const breakpoint = useBreakpoint()
  const initial = useDemoParam("step", ALL_STEPS) ?? "invite"

  const [step, setStep] = useState<OnboardingStep>(initial)
  const [os, setOs] = useState<InstallOs>("ios")
  const [email, setEmail] = useState<string>(STAFF_USER.email)

  /** Saves what the worker chose on a permission step, then moves on. */
  const choose = (permissions: Partial<StaffProfile["permissions"]>, next: OnboardingStep) => {
    update.mutate({ permissions })
    setStep(next)
  }

  const push = usePush("staff")
  /** Real permission and subscription where push works; the simulated step where it can't. */
  const allowPush = async () => {
    if (push.status === "unavailable" || push.status === "unconfigured") {
      return choose({ push: true }, "done")
    }
    const result = await push.enable.mutateAsync().catch(() => "off" as const)
    choose({ push: result === "on" }, "done")
  }

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
      {step === "signin" && (
        <SigninStep email={email} onEmail={setEmail} onNext={() => go("code")} />
      )}
      {step === "code" && <CodeStep email={email} onNext={() => go("profile")} />}
      {step === "profile" && <ProfileStep onNext={() => go("location")} />}
      {step === "location" && (
        <LocationStep
          onNext={() => choose({ location: true }, "install")}
          onSkip={() => choose({ location: false }, "install")}
        />
      )}
      {step === "install" && (
        <InstallStep
          os={os}
          onOs={setOs}
          onNext={() => choose({ installed: true }, "push")}
          onSkip={() => choose({ installed: false }, "push")}
        />
      )}
      {step === "push" && (
        <PushStep onAllow={allowPush} onSkip={() => choose({ push: false }, "done")} />
      )}
      {step === "done" && <DoneStep pushOn={profile?.permissions.push ?? true} onFinish={finish} />}
    </OnboardingFrame>
  )
}
