"use client"

import { useEffect, useState } from "react"

import { ApiError, staffRepo, type ClockCheck, type ClockPunch, type HomeShift } from "@/lib/data"
import type { ClockStep } from "@/mocks/clock"

import { useAfterPunch } from "../data/queries"
import { useStaffSession } from "../session/staff-session"
import { punchRequest, simulatedFix, type ClockSim } from "./punch"

const START_ACCURACY_M = 140
const TARGET_ACCURACY_M = 18
const POLL_MS = 2000

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Try again."

type Input = { shift: HomeShift | null | undefined; sim: ClockSim; initialStep: ClockStep }

/**
 * Geofenced clock-in as a state machine. The location reading narrows on screen, then the SERVER
 * judges the fix; the selfie is a flag until the camera provider exists; offline punches are queued
 * with their original time; out-of-fence requests wait for dispatch (polled).
 */
export function useClockFlow({ shift, sim, initialStep }: Input) {
  const session = useStaffSession()
  const afterPunch = useAfterPunch()
  const [step, setStep] = useState<ClockStep>(initialStep)
  const [accuracy, setAccuracy] = useState(START_ACCURACY_M)
  const [note, setNote] = useState("Garage level 3")
  const [check, setCheck] = useState<ClockCheck | null>(null)
  const [punch, setPunch] = useState<ClockPunch | null>(null)
  const [offlineAt, setOfflineAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The reading narrows by ~22% every 260 ms until it is good enough...
  useEffect(() => {
    if (step !== "locating") return
    const id = setInterval(
      () => setAccuracy((a) => Math.max(TARGET_ACCURACY_M, Math.round(a * 0.78))),
      260,
    )
    return () => clearInterval(id)
  }, [step])

  // ...then the scenario decides where it leads; for a real reading the server decides.
  useEffect(() => {
    if (step !== "locating" || accuracy > TARGET_ACCURACY_M || !shift) return
    let cancelled = false
    const id = setTimeout(async () => {
      if (sim === "denied") return setStep("denied")
      if (sim === "offline") return setStep("camera")
      try {
        const result = await staffRepo.clockCheck({
          assignmentId: shift.assignmentId,
          location: simulatedFix(sim, shift.venueGeo),
        })
        if (cancelled) return
        setCheck(result)
        setStep(result.verdict === "inside" ? "camera" : "outside")
      } catch (e) {
        if (!cancelled) setError(messageOf(e))
      }
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [step, accuracy, sim, shift])

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

  /** Confirm sheet: record the clock-in (queued with its original time when offline). */
  const submitClockIn = () =>
    run(async () => {
      if (!shift) return
      const location = simulatedFix(sim, shift.venueGeo)
      if (sim === "offline") {
        const at = new Date()
        setOfflineAt(at)
        session.queuePunch({
          kind: "in",
          req: punchRequest({
            assignmentId: shift.assignmentId,
            location,
            selfie: true,
            offline: true,
            at,
          }),
        })
        return setStep("offline")
      }
      const result = await staffRepo.clockIn(
        punchRequest({ assignmentId: shift.assignmentId, location, selfie: true }),
      )
      setPunch(result)
      await afterPunch(result)
      setStep("success")
    })

  /** Approval step: send the out-of-fence request with the note. */
  const sendRequest = () =>
    run(async () => {
      if (!shift) return
      const result = await staffRepo.clockIn(
        punchRequest({
          assignmentId: shift.assignmentId,
          location: simulatedFix(sim === "inside" ? "outside" : sim, shift.venueGeo),
          selfie: true,
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
    check,
    punch,
    offlineAt,
    error,
    busy,
    locate,
    submitClockIn,
    sendRequest,
    simulateApproval,
  }
}
