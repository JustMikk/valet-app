"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { CameraProvider, CameraSession } from "@/lib/platform"

export type CameraStatus = "starting" | "live" | "simulated" | "denied" | "unavailable"

export type CameraControl = {
  /** Callback ref for the <video> that shows the live preview. */
  attach: (video: HTMLVideoElement | null) => void
  status: CameraStatus
  /** The first frame has arrived, so a capture will not be blank. */
  ready: boolean
  onFrame: () => void
  /** Captures the frame and turns the camera off. Null when there is nothing to capture yet. */
  shoot: () => { image: string | null } | null
  /** Try opening the camera again (after the worker fixed the permission). */
  retry: () => void
}

function showStream(video: HTMLVideoElement, stream: MediaStream) {
  if (video.srcObject === stream) return
  video.srcObject = stream
  void video.play().catch(() => {})
}

/**
 * Opens the camera while `active`, shows it in a <video>, and always releases it (the indicator
 * light goes off) when the step ends, the screen unmounts or a photo is taken.
 */
export function useCamera(active: boolean, provider: CameraProvider): CameraControl {
  const videoEl = useRef<HTMLVideoElement | null>(null)
  const sessionRef = useRef<CameraSession | null>(null)
  const [status, setStatus] = useState<CameraStatus>("starting")
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    void provider.open().then((outcome) => {
      if (cancelled) {
        if (outcome.ok) outcome.session.stop()
        return
      }
      if (!outcome.ok) return setStatus(outcome.reason === "denied" ? "denied" : "unavailable")
      sessionRef.current = outcome.session
      if (outcome.session.stream && videoEl.current)
        showStream(videoEl.current, outcome.session.stream)
      setStatus(outcome.session.stream ? "live" : "simulated")
    })
    return () => {
      cancelled = true
      sessionRef.current?.stop()
      sessionRef.current = null
      setStatus("starting")
      setReady(false)
    }
  }, [active, provider, attempt])

  // The <video> can mount after the stream is already open; connect whichever arrives second.
  const attach = useCallback((video: HTMLVideoElement | null) => {
    videoEl.current = video
    const stream = sessionRef.current?.stream
    if (video && stream) showStream(video, stream)
  }, [])

  const shoot = useCallback(() => {
    const session = sessionRef.current
    if (!session) return null
    const image = session.capture(videoEl.current)
    if (session.stream && !image) return null
    session.stop()
    sessionRef.current = null
    return { image }
  }, [])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const onFrame = useCallback(() => setReady(true), [])

  return { attach, status, ready: status === "simulated" || ready, onFrame, shoot, retry }
}
