// Pure geofence math (handoff §6.1). The device's verdict is advisory UX only; the server runs
// the same function on the raw sample and its answer is final (product spec §8.8).

const EARTH_RADIUS_M = 6_371_008.8

export type LatLng = { lat: number; lng: number }
export type LocationFix = LatLng & { accuracyM: number }
export type Fence = LatLng & {
  /** Venue radius in meters. */
  radiusM: number
  /** Worst accuracy still good enough to judge a position (tenant setting). */
  maxAccuracyM: number
}

/** `inside`, `outside`, or `low_accuracy` (can't confirm either way: product spec §8.2). */
export type GeofenceVerdict = "inside" | "outside" | "low_accuracy"
export type GeofenceResult = { verdict: GeofenceVerdict; distanceM: number }

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Accuracy-aware verdict. The true position lies within `accuracyM` of the reported one, so:
 * a fix that is too coarse, or whose uncertainty circle straddles the fence edge, cannot be
 * confirmed; otherwise it is inside when the whole circle is within the radius and outside when
 * none of it is.
 */
export function classifyFix(fix: LocationFix, fence: Fence): GeofenceResult {
  const distanceM = Math.round(distanceMeters(fix, fence))
  if (!Number.isFinite(fix.accuracyM) || fix.accuracyM < 0 || fix.accuracyM > fence.maxAccuracyM) {
    return { verdict: "low_accuracy", distanceM }
  }
  if (distanceM + fix.accuracyM <= fence.radiusM) return { verdict: "inside", distanceM }
  if (distanceM - fix.accuracyM > fence.radiusM) return { verdict: "outside", distanceM }
  return { verdict: "low_accuracy", distanceM }
}

/** A point `meters` due north of `origin`: how demos and tests place a worker at a known distance. */
export function offsetNorth(origin: LatLng, meters: number): LatLng {
  const dLat = (meters / EARTH_RADIUS_M) * (180 / Math.PI)
  return { lat: origin.lat + dLat, lng: origin.lng }
}
