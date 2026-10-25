import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { webCamera } from "./camera.web"
import { webLocation } from "./location.web"
import { simulatedLocation } from "./simulated"

type PositionCb = (p: GeolocationPosition) => void
type ErrorCb = (e: GeolocationPositionError) => void

function stubGeolocation() {
  let onPosition: PositionCb = () => {}
  let onError: ErrorCb = () => {}
  const clearWatch = vi.fn()
  vi.stubGlobal("navigator", {
    geolocation: {
      watchPosition: vi.fn((ok: PositionCb, fail: ErrorCb) => {
        onPosition = ok
        onError = fail
        return 7
      }),
      clearWatch,
    },
  })
  const position = (accuracy: number) =>
    onPosition({
      coords: { latitude: 37.79, longitude: -122.39, accuracy },
    } as GeolocationPosition)
  const fail = (code: number) => onError({ code } as GeolocationPositionError)
  return { position, fail, clearWatch }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("webLocation", () => {
  it("refines the reading, reports progress and stops watching at a good-enough fix", async () => {
    const geo = stubGeolocation()
    const progress: number[] = []
    const result = webLocation.acquire({
      targetAccuracyM: 75,
      timeoutMs: 15_000,
      onProgress: (m) => progress.push(m),
    })
    geo.position(140)
    geo.position(90)
    geo.position(30.4)
    await expect(result).resolves.toEqual({
      ok: true,
      fix: { lat: 37.79, lng: -122.39, accuracyM: 30.4 },
    })
    expect(progress).toEqual([140, 90, 30])
    expect(geo.clearWatch).toHaveBeenCalledWith(7)
  })

  it("never lets a worse fix replace a better one", async () => {
    const geo = stubGeolocation()
    const result = webLocation.acquire({ targetAccuracyM: 10, timeoutMs: 5000 })
    geo.position(50)
    geo.position(200)
    await vi.advanceTimersByTimeAsync(5000)
    await expect(result).resolves.toMatchObject({ ok: true, fix: { accuracyM: 50 } })
  })

  it("returns the best fix when time runs out, or a timeout when there is none", async () => {
    const geo = stubGeolocation()
    const withFix = webLocation.acquire({ targetAccuracyM: 10, timeoutMs: 3000 })
    geo.position(120)
    await vi.advanceTimersByTimeAsync(3000)
    await expect(withFix).resolves.toMatchObject({ ok: true, fix: { accuracyM: 120 } })

    stubGeolocation()
    const none = webLocation.acquire({ targetAccuracyM: 10, timeoutMs: 3000 })
    await vi.advanceTimersByTimeAsync(3000)
    await expect(none).resolves.toEqual({ ok: false, reason: "timeout" })
  })

  it("reports a denied permission and unavailable positioning distinctly", async () => {
    const denied = stubGeolocation()
    const a = webLocation.acquire({ targetAccuracyM: 75, timeoutMs: 5000 })
    denied.fail(1)
    await expect(a).resolves.toEqual({ ok: false, reason: "denied" })

    const unavailable = stubGeolocation()
    const b = webLocation.acquire({ targetAccuracyM: 75, timeoutMs: 5000 })
    unavailable.fail(2)
    await expect(b).resolves.toEqual({ ok: false, reason: "unavailable" })
  })

  it("releases the device when aborted, and reports no support without the API", async () => {
    const geo = stubGeolocation()
    const controller = new AbortController()
    const result = webLocation.acquire({
      targetAccuracyM: 75,
      timeoutMs: 5000,
      signal: controller.signal,
    })
    controller.abort()
    await expect(result).resolves.toEqual({ ok: false, reason: "timeout" })
    expect(geo.clearWatch).toHaveBeenCalled()

    vi.stubGlobal("navigator", {})
    await expect(webLocation.acquire({ targetAccuracyM: 75, timeoutMs: 1 })).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    })
  })
})

describe("webCamera", () => {
  const stubMedia = (getUserMedia: () => Promise<unknown>) =>
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })

  it("maps a refused permission to denied and other failures to unavailable", async () => {
    stubMedia(() => Promise.reject(new DOMException("no", "NotAllowedError")))
    await expect(webCamera.open()).resolves.toEqual({ ok: false, reason: "denied" })
    stubMedia(() => Promise.reject(new DOMException("none", "NotFoundError")))
    await expect(webCamera.open()).resolves.toEqual({ ok: false, reason: "unavailable" })
    vi.stubGlobal("navigator", {})
    await expect(webCamera.open()).resolves.toEqual({ ok: false, reason: "unsupported" })
  })

  it("opens the front camera video-only, stops every track, and has no frame before the video plays", async () => {
    const track = { stop: vi.fn() }
    const request = vi.fn(async () => ({ getTracks: () => [track, track] }))
    stubMedia(request)
    const outcome = await webCamera.open()
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: false,
        video: expect.objectContaining({ facingMode: "user" }),
      }),
    )
    if (!outcome.ok) throw new Error("expected the camera to open")
    expect(
      outcome.session.capture({ videoWidth: 0, videoHeight: 0 } as HTMLVideoElement),
    ).toBeNull()
    expect(outcome.session.capture(null)).toBeNull()
    outcome.session.stop()
    expect(track.stop).toHaveBeenCalledTimes(2)
  })
})

describe("simulatedLocation", () => {
  const fix = { lat: 37.79, lng: -122.39, accuracyM: 18 }

  it("narrows to the scenario's accuracy, then settles", async () => {
    const progress: number[] = []
    const result = simulatedLocation(fix).acquire({
      targetAccuracyM: 75,
      timeoutMs: 15_000,
      onProgress: (m) => progress.push(m),
    })
    await vi.advanceTimersByTimeAsync(5000)
    await expect(result).resolves.toEqual({ ok: true, fix })
    expect(progress[0]).toBeLessThan(140)
    expect(progress.at(-1)).toBe(18)
  })

  it("simulates a denied permission with a null fix", async () => {
    await expect(
      simulatedLocation(null).acquire({ targetAccuracyM: 75, timeoutMs: 1 }),
    ).resolves.toEqual({ ok: false, reason: "denied" })
  })
})
