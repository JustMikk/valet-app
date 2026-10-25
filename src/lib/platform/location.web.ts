import type { AcquireOptions, GeoFix, LocationOutcome, LocationProvider } from "./types"

const PERMISSION_DENIED = 1
const TIMEOUT = 3

/** Browser Geolocation: a short high-accuracy watch that ends at the first good-enough fix. */
export const webLocation: LocationProvider = {
  acquire({ targetAccuracyM, timeoutMs, onProgress, signal }: AcquireOptions) {
    return new Promise<LocationOutcome>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return resolve({ ok: false, reason: "unsupported" })
      }
      const geo = navigator.geolocation
      let best: GeoFix | null = null
      let settled = false
      let watchId: number | null = null

      const finish = (outcome: LocationOutcome) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (watchId !== null) geo.clearWatch(watchId)
        signal?.removeEventListener("abort", onAbort)
        resolve(outcome)
      }
      const fallback = (reason: "timeout" | "unavailable"): LocationOutcome =>
        best ? { ok: true, fix: best } : { ok: false, reason }
      const onAbort = () => finish({ ok: false, reason: "timeout" })
      const timer = setTimeout(() => finish(fallback("timeout")), timeoutMs)
      signal?.addEventListener("abort", onAbort)

      watchId = geo.watchPosition(
        (position) => {
          const fix: GeoFix = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          }
          if (!best || fix.accuracyM < best.accuracyM) best = fix
          onProgress?.(Math.round(best.accuracyM))
          if (best.accuracyM <= targetAccuracyM) finish({ ok: true, fix: best })
        },
        (error) => {
          if (error.code === PERMISSION_DENIED) return finish({ ok: false, reason: "denied" })
          finish(fallback(error.code === TIMEOUT ? "timeout" : "unavailable"))
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
      )
      // An already-aborted signal must not leave the watch running.
      if (signal?.aborted) onAbort()
    })
  },
}
