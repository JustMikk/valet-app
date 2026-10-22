"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useTicker } from "@/hooks/use-ticker"
import { formatHoursMinutes } from "@/lib/time/duration"
import { CLOCK_SIMS, CLOCK_STEPS, type ClockStep } from "@/mocks/clock"

import { useStaffSession } from "../session/staff-session"
import { useDemoParam } from "../session/use-demo-param"
import { ClockFrame } from "./clock-frame"
import { ApprovalStep } from "./steps/approval-step"
import { CameraStep } from "./steps/camera-step"
import { ConfirmStep } from "./steps/confirm-step"
import { DeniedStep } from "./steps/denied-step"
import { DoneStep } from "./steps/done-step"
import { LocatingStep } from "./steps/locating-step"
import { OutsideStep } from "./steps/outside-step"
import { PendingStep } from "./steps/pending-step"

const START_ACCURACY_M = 140
const TARGET_ACCURACY_M = 18

/**
 * Geofenced clock-in / clock-out. The location reading, selfie and approval are simulated: the
 * `?sim=` scenario (inside, outside, offline, denied) decides how the reading resolves, and
 * `?step=` jumps to a screen. Real providers replace this once the platform layer exists.
 */
export function ClockFlow() {
  const router = useRouter()
  const session = useStaffSession()
  const sim = useDemoParam("sim", CLOCK_SIMS) ?? "inside"
  const initialStep = useDemoParam("step", CLOCK_STEPS) ?? "locating"
  const secs = Number(useSearchParams().get("secs")) || 0

  const [step, setStep] = useState<ClockStep>(initialStep)
  const [accuracy, setAccuracy] = useState(START_ACCURACY_M)
  const [note, setNote] = useState("Garage level 3")
  const waitSecs = useTicker(step === "pending")

  // The reading narrows by ~22% every 260 ms until it is good enough...
  useEffect(() => {
    if (step !== "locating") return
    const id = setInterval(
      () => setAccuracy((a) => Math.max(TARGET_ACCURACY_M, Math.round(a * 0.78))),
      260,
    )
    return () => clearInterval(id)
  }, [step])

  // ...then the scenario decides where it leads.
  useEffect(() => {
    if (step !== "locating" || accuracy > TARGET_ACCURACY_M) return
    const id = setTimeout(
      () => setStep(sim === "outside" ? "outside" : sim === "denied" ? "denied" : "camera"),
      450,
    )
    return () => clearTimeout(id)
  }, [step, accuracy, sim])

  const locate = () => {
    setAccuracy(START_ACCURACY_M)
    setStep("locating")
  }
  const close = () => router.push("/staff")
  const finish = () => {
    if (step === "outdone") session.clockOut()
    else session.clockIn({ offline: step === "offline" })
    router.replace("/staff")
  }

  return (
    <ClockFrame>
      {step === "locating" && <LocatingStep accuracy={accuracy} onClose={close} />}
      {step === "outside" && (
        <OutsideStep
          onClose={close}
          onRetry={locate}
          onRequestApproval={() => setStep("approval")}
        />
      )}
      {step === "approval" && (
        <ApprovalStep
          note={note}
          onNote={setNote}
          onBack={() => setStep("outside")}
          onRetake={() => setStep("camera")}
          onSend={() => setStep("pending")}
        />
      )}
      {step === "pending" && (
        <PendingStep
          waitSecs={waitSecs}
          note={note}
          onSimulateApproval={() => setStep("success")}
        />
      )}
      {step === "camera" && (
        <CameraStep
          inside={sim !== "outside"}
          onClose={close}
          onShoot={() => setStep(sim === "outside" ? "approval" : "confirm")}
        />
      )}
      {step === "confirm" && (
        <ConfirmStep
          onRetake={() => setStep("camera")}
          onSubmit={() => setStep(sim === "offline" ? "offline" : "success")}
        />
      )}
      {(step === "success" || step === "offline" || step === "outdone") && (
        <DoneStep step={step} workedLabel={formatHoursMinutes(secs)} onDone={finish} />
      )}
      {step === "denied" && <DeniedStep onClose={close} onRetry={locate} />}
    </ClockFrame>
  )
}
