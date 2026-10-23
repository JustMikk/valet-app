import { describe, expect, it } from "vitest"

import { parsePlaces } from "./photon"

const feature = (properties: Record<string, unknown>, coordinates = [-122.39, 37.79]) => ({
  type: "Feature",
  properties,
  geometry: { type: "Point", coordinates },
})

describe("parsePlaces", () => {
  it("reads name, address and coordinates (GeoJSON order is lng, lat)", () => {
    const [place] = parsePlaces({
      features: [
        feature({
          osm_type: "W",
          osm_id: 558731934,
          name: "San Francisco Ferry Building",
          housenumber: "1",
          street: "The Embarcadero",
          city: "San Francisco",
          state: "California",
          country: "United States",
        }),
      ],
    })
    expect(place).toEqual({
      id: "W558731934",
      name: "San Francisco Ferry Building",
      address: "1 The Embarcadero, San Francisco, California, United States",
      lat: 37.79,
      lng: -122.39,
    })
  })

  it("uses the street as the name when a place has none", () => {
    const [place] = parsePlaces({
      features: [feature({ housenumber: "400", street: "Market St", city: "San Francisco" })],
    })
    expect(place.name).toBe("400 Market St")
    expect(place.address).toBe("San Francisco")
  })

  it("drops duplicates and unnamed results", () => {
    const same = { name: "Pier 3", city: "San Francisco" }
    const result = parsePlaces({ features: [feature(same), feature(same), feature({})] })
    expect(result).toHaveLength(1)
  })

  it("returns nothing for a payload it does not understand", () => {
    expect(parsePlaces(null)).toEqual([])
    expect(parsePlaces({ features: "no" })).toEqual([])
    expect(parsePlaces({ features: [{ properties: {}, geometry: { coordinates: [1] } }] })).toEqual(
      [],
    )
  })
})
