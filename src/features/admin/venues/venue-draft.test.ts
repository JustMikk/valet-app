import { describe, expect, it } from "vitest"

import { draftFor, pinOf, requestFrom, withPlace } from "./venue-draft"

const place = {
  id: "W1",
  name: "Ferry Building",
  address: "1 The Embarcadero, San Francisco",
  lat: 37.7955487,
  lng: -122.3934746,
}

describe("venue draft", () => {
  it("starts empty with the default radius", () => {
    const draft = draftFor(undefined, 150)
    expect(draft.radiusM).toBe(150)
    expect(pinOf(draft)).toBeNull()
    expect(requestFrom(draft)).toBeNull()
  })

  it("takes a searched place's name, address and position", () => {
    const draft = withPlace(draftFor(undefined, 150), place)
    expect(draft.name).toBe("Ferry Building")
    expect(draft.street).toBe("1 The Embarcadero, San Francisco")
    expect(pinOf(draft)).toEqual({ lat: 37.795549, lng: -122.393475 })
  })

  it("is not a request until the details are filled in", () => {
    const located = withPlace(draftFor(undefined, 150), place)
    expect(requestFrom(located)).toBeNull()
    const request = requestFrom({ ...located, rate: "41.50", contactName: " Rae " })
    expect(request).toMatchObject({
      name: "Ferry Building",
      billRateCents: 4150,
      contactName: "Rae",
      radiusM: 150,
    })
  })

  it("rejects coordinates that are off the globe", () => {
    expect(pinOf({ ...draftFor(undefined, 150), lat: "91", lng: "0" })).toBeNull()
    expect(pinOf({ ...draftFor(undefined, 150), lat: "abc", lng: "0" })).toBeNull()
  })
})
