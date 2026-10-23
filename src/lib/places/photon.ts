// Photon (https://photon.komoot.io): free, key-less place search over OpenStreetMap data, built for
// search-as-you-type. The public instance is for light use; self-host it (or switch provider) for
// real traffic. The response is validated at the boundary like every other external payload.
import { z } from "zod/mini"

import type { Place, PlacesProvider } from "./types"

const ENDPOINT = "https://photon.komoot.io/api/"
const LIMIT = 6

const Feature = z.object({
  properties: z.object({
    osm_type: z.optional(z.string()),
    osm_id: z.optional(z.number()),
    name: z.optional(z.string()),
    housenumber: z.optional(z.string()),
    street: z.optional(z.string()),
    city: z.optional(z.string()),
    locality: z.optional(z.string()),
    district: z.optional(z.string()),
    state: z.optional(z.string()),
    country: z.optional(z.string()),
  }),
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
})
const Response = z.object({ features: z.array(Feature) })

/** Turns Photon's GeoJSON into places, dropping near-duplicates (the same name and address). */
export function parsePlaces(payload: unknown): Place[] {
  const parsed = Response.safeParse(payload)
  if (!parsed.success) return []
  const seen = new Set<string>()
  const places: Place[] = []
  for (const { properties: p, geometry } of parsed.data.features) {
    const streetLine = p.street ? (p.housenumber ? `${p.housenumber} ${p.street}` : p.street) : ""
    const name = p.name ?? (streetLine || p.city || "")
    if (!name) continue
    const town = p.city ?? p.locality ?? p.district
    const address = [p.name ? streetLine : "", town, p.state, p.country]
      .filter((part, i, all) => part && all.indexOf(part) === i && part !== name)
      .join(", ")
    const key = `${name}|${address}`
    if (seen.has(key)) continue
    seen.add(key)
    const [lng, lat] = geometry.coordinates
    places.push({
      id: p.osm_type && p.osm_id ? `${p.osm_type}${p.osm_id}` : key,
      name,
      address,
      lat,
      lng,
    })
  }
  return places
}

export const photon: PlacesProvider = {
  async search(query, signal) {
    const url = `${ENDPOINT}?${new URLSearchParams({ q: query, limit: String(LIMIT), lang: "en" })}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Place search failed (${res.status}).`)
    return parsePlaces(await res.json())
  },
}
