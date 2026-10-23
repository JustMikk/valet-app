// Stand-ins for the device, used by the `?sim=` demo links and the static (fixture) build, where
// there is no venue to stand at. They behave like the real providers: the reading narrows over
// time, and the scenario decides whether it ends inside, outside or denied.
import type { CameraProvider, GeoFix, LocationProvider } from "./types"

const START_ACCURACY_M = 140
const STEP_MS = 260
const SETTLE_MS = 450

/** `fix` is where the simulated worker stands; null simulates a denied permission. */
export function simulatedLocation(fix: GeoFix | null): LocationProvider {
  return {
    acquire({ onProgress, signal }) {
      return new Promise((resolve) => {
        if (!fix) return resolve({ ok: false, reason: "denied" })
        let accuracy = START_ACCURACY_M
        const finish = (outcome: Parameters<typeof resolve>[0]) => {
          clearInterval(ticker)
          clearTimeout(settle)
          signal?.removeEventListener("abort", onAbort)
          resolve(outcome)
        }
        const onAbort = () => finish({ ok: false, reason: "timeout" })
        let settle: ReturnType<typeof setTimeout> | undefined
        const ticker = setInterval(() => {
          accuracy = Math.max(fix.accuracyM, Math.round(accuracy * 0.78))
          onProgress?.(accuracy)
          if (accuracy <= fix.accuracyM) {
            clearInterval(ticker)
            settle = setTimeout(() => finish({ ok: true, fix }), SETTLE_MS)
          }
        }, STEP_MS)
        signal?.addEventListener("abort", onAbort)
      })
    },
  }
}

/** A camera with no live stream: the screen shows its placeholder and no image is captured. */
export const simulatedCamera: CameraProvider = {
  open: async () => ({ ok: true, session: { stream: null, capture: () => null, stop: () => {} } }),
}
