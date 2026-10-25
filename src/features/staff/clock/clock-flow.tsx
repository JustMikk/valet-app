"use client"

import { useRouter } from "next/navigation"

import { useHydrated } from "@/hooks/use-hydrated"
import { useNow } from "@/hooks/use-now"
import { formatTime } from "@/lib/time/labels"
import { formatHoursMinutes } from "@/lib/time/duration"
import type { ClockPunch } from "@/lib/data"
import { CLOCK_STEPS } from "@/mocks/clock"

import { ErrorNotice, ScreenSkeleton } from "../data/query-state"
import { keys, useHome, useStash } from "../data/queries"
import { useDemoParam } from "../session/use-demo-param"
import { ClockFrame, ClockScreen } from "./clock-frame"
import { DEMO_DONE, doneContent, doneInfoFromPunch, venueView, type DoneInfo } from "./clock-view"
import { ApprovalStep } from "./steps/approval-step"
import { CameraStep } from "./steps/camera-step"
import { ConfirmStep } from "./steps/confirm-step"
import { DeniedStep } from "./steps/denied-step"
import { DoneStep } from "./steps/done-step"
import { LocatingStep } from "./steps/locating-step"
import { OutsideStep } from "./steps/outside-step"
import { PendingStep } from "./steps/pending-step"
import { useCamera } from "./use-camera"
import { useClockFlow } from "./use-clock-flow"
import { useDevice } from "./use-device"
import { useTicker } from "@/hooks/use-ticker"

/**
 * Geofenced clock-in / clock-out. `?sim=` (inside, outside, offline, denied) stands in for the
 * device reading until the location provider exists; `?step=` jumps to a screen. The server judges
 * the position and records the punch.
 */
export function ClockFlow() {
  const router = useRouter()
  const home = useHome()
  const hydrated = useHydrated()
  const homeData = hydrated ? home.data : undefined
  const homeError = hydrated ? home.error : null
  const shift = homeData?.shift
  const initialStep = useDemoParam("step", CLOCK_STEPS) ?? "locating"
  const lastPunch = useStash<ClockPunch>(keys.lastPunch)
  const now = useNow(1000)
  const device = useDevice(shift?.venueGeo, "in")
  const flow = useClockFlow({ shift, device, initialStep })
  const { step } = flow
  const camera = useCamera(step === "camera", device.camera)
  const cameraBlocked = camera.status === "denied" || camera.status === "unavailable"
  const waitSecs = useTicker(step === "pending")

  const venue = venueView({
    check: flow.check,
    fallbackName: shift?.venue,
    fallbackHours: shift?.rangeLabel,
    sim: device.sim ?? "inside",
    nowLabel: formatTime(flow.offlineAt ?? now, shift?.timezone ?? "America/Los_Angeles"),
  })

  const close = () => router.push("/staff")
  const finish = () => router.replace("/staff")

  const doneFor = (kind: "success" | "offline" | "outdone") => {
    const info: DoneInfo =
      kind === "success" && flow.punch
        ? doneInfoFromPunch(flow.punch)
        : kind === "outdone" && lastPunch
          ? doneInfoFromPunch(lastPunch)
          : kind === "offline"
            ? { ...DEMO_DONE, effectiveLabel: venue.clockInTime, venueName: venue.name }
            : { ...DEMO_DONE, workedLabel: formatHoursMinutes(0) }
    return doneContent(kind, info)
  }

  if (!shift && step !== "outdone" && step !== "denied") {
    return (
      <ClockFrame>
        <ClockScreen>
          {homeError ? (
            <ErrorNotice message={homeError.message} onRetry={() => void home.refetch()} />
          ) : homeData ? (
            <ErrorNotice message="You have no upcoming shift to clock in to." />
          ) : (
            <ScreenSkeleton rows={2} />
          )}
        </ClockScreen>
      </ClockFrame>
    )
  }

  return (
    <ClockFrame>
      {step === "locating" && (
        <LocatingStep
          accuracy={flow.accuracy}
          neededAccuracyM={venue.neededAccuracyM}
          onClose={close}
        />
      )}
      {step === "outside" && (
        <OutsideStep
          venue={venue}
          onClose={close}
          onRetry={flow.locate}
          onRequestApproval={() => flow.setStep("approval")}
        />
      )}
      {step === "approval" && (
        <ApprovalStep
          venue={venue}
          photo={flow.photo}
          busy={flow.busy}
          note={flow.note}
          onNote={flow.setNote}
          onBack={() => flow.setStep("outside")}
          onRetake={() => flow.setStep("camera")}
          onSend={flow.sendRequest}
        />
      )}
      {step === "pending" && (
        <PendingStep
          venue={venue}
          waitSecs={waitSecs}
          note={flow.note}
          onSimulateApproval={flow.simulateApproval}
        />
      )}
      {step === "camera" && !cameraBlocked && (
        <CameraStep
          attach={camera.attach}
          status={camera.status}
          ready={camera.ready}
          onFrame={camera.onFrame}
          inside={flow.check ? flow.check.verdict === "inside" : device.sim !== "outside"}
          distanceM={venue.distanceM}
          onClose={close}
          onShoot={() => {
            const shot = camera.shoot()
            if (shot) flow.photographed(shot.image)
          }}
        />
      )}
      {step === "camera" && cameraBlocked && (
        <DeniedStep kind="camera" onClose={close} onRetry={camera.retry} />
      )}
      {step === "confirm" && (
        <ConfirmStep
          venue={venue}
          photo={flow.photo}
          busy={flow.busy}
          onRetake={() => flow.setStep("camera")}
          onSubmit={flow.submitClockIn}
        />
      )}
      {(step === "success" || step === "offline" || step === "outdone") && (
        <DoneStep step={step} content={doneFor(step)} onDone={finish} />
      )}
      {step === "denied" && <DeniedStep onClose={close} onRetry={flow.locate} />}
      {flow.error && (
        <div className="absolute inset-x-5 top-24 z-20 tablet:top-20">
          <ErrorNotice
            message={flow.error}
            onRetry={step === "locating" ? flow.locate : undefined}
          />
        </div>
      )}
    </ClockFrame>
  )
}
