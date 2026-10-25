"use client"

import { useEffect, useState } from "react"

import { ApiError, staffRepo, type ClockCheck, type ClockPunch, type HomeShift } from "@/lib/data"
import type { GeoFix } from "@/lib/platform"
import type { ClockStep } from "@/mocks/clock"

import { useAfterPunch } from "../data/queries"
import { useStaffSession } from "../session/staff-session"
import { punchRequest } from "./punch"
import type { Device } from "./use-device"

const START_ACCURACY_M = 140
const POLL_MS = 2000
const FIX_TIMEOUT_MS = 20_000

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Try again."

type Input = { shift: HomeShift | null | undefined; device: Device; initialStep: ClockStep }

/**
 * Geofenced clock-in as a state machine. The device reading (real GPS, or a `?sim=` scenario)
 * narrows on screen; then the SERVER judges the fix. The selfie is a live camera frame. Offline
 * punches are queued with their original time; out-of-fence requests wait for dispatch (polled).
 */
export function useClockFlow({ shift, device, initialStep }: Input) {
  const session = useStaffSession()
  const afterPunch = useAfterPunch()
  const [step, setStep] = useState<ClockStep>(initialStep)
  const [accuracy, setAccuracy] = useState(START_ACCURACY_M)
  const [note, setNote] = useState("Garage level 3")
  const [fix, setFix] = useState<GeoFix | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [check, setCheck] = useState<ClockCheck | null>(null)
  const [punch, setPunch] = useState<ClockPunch | null>(null)
  const [offlineAt, setOfflineAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const assignmentId = shift?.assignmentId
  const neededAccuracyM = shift?.neededAccuracyM
  const { location, isOffline } = device

  // Take the reading, then let the server judge it.
  useEffect(() => {
    if (step !== "locating" || !assignmentId || neededAccuracyM === undefined) return
    const controller = new AbortController()
    void (async () => {
      const outcome = await location.acquire({
        targetAccuracyM: neededAccuracyM,
        timeoutMs: FIX_TIMEOUT_MS,
        onProgress: setAccuracy,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!outcome.ok) {
        if (outcome.reason === "denied" || outcome.reason === "unsupported")
          return setStep("denied")
        return setError("We couldn't get a location fix. Step outside and try again.")
      }
      setFix(outcome.fix)
      if (isOffline()) return setStep("camera")
      try {
        const result = await staffRepo.clockCheck({ assignmentId, location: outcome.fix })
        if (controller.signal.aborted) return
        setCheck(result)
        setStep(result.verdict === "inside" ? "camera" : "outside")
      } catch (e) {
        if (!controller.signal.aborted) setError(messageOf(e))
      }
    })()
    return () => controller.abort()
  }, [step, assignmentId, neededAccuracyM, location, isOffline])

  // Waiting for dispatch: ask for the decision until there is one.
  useEffect(() => {
    if (step !== "pending" || !punch) return
    const id = setInterval(async () => {
      try {
        const status = await staffRepo.clockRequest(punch.punchId)
        if (status.status === "approved") {
          const approved = {
            ...punch,
            status: "accepted" as const,
            effectiveLabel: status.effectiveLabel ?? punch.effectiveLabel,
          }
          setPunch(approved)
          await afterPunch(approved)
          setStep("success")
        } else if (status.status === "rejected") {
          setError("Dispatch couldn't approve this clock-in. Message dispatch for help.")
          setStep("outside")
        }
      } catch {
        // A missed poll is harmless: the next one tries again.
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [step, punch, afterPunch])

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (e) {
      if (e instanceof ApiError && e.code === "outside_fence") setStep("outside")
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  const locate = () => {
    setAccuracy(START_ACCURACY_M)
    setError(null)
    setStep("locating")
  }

  /** The camera took the selfie: keep it and move to confirm (or to the approval request). */
  const photographed = (image: string | null) => {
    setPhoto(image)
    const needsApproval = check ? check.verdict !== "inside" : device.sim === "outside"
    setStep(needsApproval ? "approval" : "confirm")
  }

  /** Confirm sheet: record the clock-in (queued with its original time when offline). */
  const submitClockIn = () =>
    run(async () => {
      if (!assignmentId) return
      const base = { assignmentId, location: fix ?? undefined, selfie: true, selfieImage: photo }
      if (isOffline()) {
        const at = new Date()
        setOfflineAt(at)
        session.queuePunch({ kind: "in", req: punchRequest({ ...base, offline: true, at }) })
        return setStep("offline")
      }
      const result = await staffRepo.clockIn(punchRequest(base))
      setPunch(result)
      await afterPunch(result)
      setStep("success")
    })

  /** Approval step: send the out-of-fence request with the selfie and the note. */
  const sendRequest = () =>
    run(async () => {
      if (!assignmentId) return
      const result = await staffRepo.clockIn(
        punchRequest({
          assignmentId,
          location: fix ?? undefined,
          selfie: true,
          selfieImage: photo,
          requestApproval: true,
          note,
        }),
      )
      setPunch(result)
      setStep("pending")
    })

  /** Prototype shortcut: stands in for dispatch approving right now. */
  const simulateApproval = () =>
    run(async () => {
      if (punch) await staffRepo.demoApprove(punch.punchId)
    })

  return {
    step,
    setStep,
    accuracy,
    note,
    setNote,
    photo,
    check,
    punch,
    offlineAt,
    error,
    busy,
    locate,
    photographed,
    submitClockIn,
    sendRequest,
    simulateApproval,
  }
}
