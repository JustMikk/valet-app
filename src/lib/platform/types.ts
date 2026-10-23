// Device capabilities behind interfaces (handoff §5.1): the web implementations live beside this
// file, and a Capacitor implementation can replace them later without touching a screen. These are
// the only modules allowed to call navigator.geolocation / mediaDevices (ESLint rule).

export type GeoFix = { lat: number; lng: number; accuracyM: number }

export type LocationFailure = "denied" | "unavailable" | "timeout" | "unsupported"
export type LocationOutcome = { ok: true; fix: GeoFix } | { ok: false; reason: LocationFailure }

export type AcquireOptions = {
  /** Stop refining as soon as a fix is at least this accurate. */
  targetAccuracyM: number
  /** Give up, returning the best fix so far (or a failure when there is none). */
  timeoutMs: number
  /** Called with the best accuracy so far, in meters, as the reading narrows. */
  onProgress?: (accuracyM: number) => void
  /** Aborting stops the reading and releases the device; the promise resolves as a timeout. */
  signal?: AbortSignal
}

export interface LocationProvider {
  /**
   * One position for one punch (product spec §8.2). It refines for a few seconds, then stops: there
   * is no continuous or background tracking (handoff §5.1).
   */
  acquire(options: AcquireOptions): Promise<LocationOutcome>
}

export type CameraFailure = "denied" | "unavailable" | "unsupported"

export interface CameraSession {
  /** The live preview, or null for a simulated camera (the screen shows a placeholder instead). */
  stream: MediaStream | null
  /** Grabs the current frame as a small JPEG data URL, or null when simulated. */
  capture(video: HTMLVideoElement | null): string | null
  /** Releases the camera (the indicator light goes off). Safe to call more than once. */
  stop(): void
}

export type CameraOutcome =
  { ok: true; session: CameraSession } | { ok: false; reason: CameraFailure }

export interface CameraProvider {
  /** Opens the front camera, live only: there is no gallery or file picker path (handoff §12). */
  open(): Promise<CameraOutcome>
}

export type PushPermission = "unsupported" | "denied" | "default" | "granted"
export type PushFailure = "denied" | "unsupported" | "failed"
export type PushSubscriptionData = { endpoint: string; keys: { p256dh: string; auth: string } }
export type PushOutcome =
  { ok: true; subscription: PushSubscriptionData } | { ok: false; reason: PushFailure }

export interface PushProvider {
  /** Where this device stands: no push here, blocked by the user, not asked yet, or allowed. */
  permission(): PushPermission
  /** The subscription this browser already holds, if any (it can outlive a sign-out). */
  current(): Promise<PushSubscriptionData | null>
  /** Asks for permission if needed, registers the worker and subscribes with the server's key. */
  subscribe(publicKey: string): Promise<PushOutcome>
  /** Drops this browser's subscription and returns its endpoint so the server can forget it. */
  unsubscribe(): Promise<string | null>
}
