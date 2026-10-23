import { describe, expect, it } from "vitest"

import { classifyFix, distanceMeters, offsetNorth, type Fence } from "./geofence"

const GRAND: Fence = { lat: 37.7937, lng: -122.3965, radiusM: 150, maxAccuracyM: 75 }

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(GRAND, GRAND)).toBe(0)
  })

  it("matches a known distance: one degree of latitude is about 111.2 km", () => {
    const d = distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
    expect(d).toBeGreaterThan(111_100)
    expect(d).toBeLessThan(111_300)
  })

  it("is symmetric", () => {
    const a = { lat: 37.79, lng: -122.4 }
    const b = { lat: 37.8, lng: -122.39 }
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6)
  })

  it("agrees with offsetNorth", () => {
    expect(distanceMeters(GRAND, offsetNorth(GRAND, 420))).toBeCloseTo(420, 0)
  })
})

describe("classifyFix", () => {
  const at = (meters: number, accuracyM: number) => ({
    ...offsetNorth(GRAND, meters),
    accuracyM,
  })

  it("is inside when the whole uncertainty circle is within the radius", () => {
    expect(classifyFix(at(38, 18), GRAND)).toEqual({ verdict: "inside", distanceM: 38 })
  })

  it("is outside when none of the uncertainty circle reaches the fence", () => {
    expect(classifyFix(at(420, 18), GRAND)).toEqual({ verdict: "outside", distanceM: 420 })
  })

  it("cannot confirm when the circle straddles the fence edge", () => {
    expect(classifyFix(at(150, 18), GRAND).verdict).toBe("low_accuracy")
    expect(classifyFix(at(160, 18), GRAND).verdict).toBe("low_accuracy")
  })

  it("cannot confirm a fix coarser than the tenant maximum, even at the center", () => {
    expect(classifyFix(at(0, 76), GRAND).verdict).toBe("low_accuracy")
    expect(classifyFix(at(0, 75), GRAND).verdict).toBe("inside")
  })

  it("treats a missing or negative accuracy as unconfirmable", () => {
    expect(classifyFix(at(0, Number.NaN), GRAND).verdict).toBe("low_accuracy")
    expect(classifyFix(at(0, -1), GRAND).verdict).toBe("low_accuracy")
  })

  it("honors a different tenant radius", () => {
    expect(classifyFix(at(200, 10), { ...GRAND, radiusM: 400 }).verdict).toBe("inside")
  })
})
