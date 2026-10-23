// Place search behind an interface (like lib/platform): the screens ask for places as the user
// types and get coordinates back; the provider (Photon today) can be swapped for Google, Mapbox or a
// self-hosted geocoder without touching a screen.
export type Place = {
  /** Stable within a result list; the provider's own id when it has one. */
  id: string
  /** The place's name: "San Francisco Ferry Building", or the street when it has none. */
  name: string
  /** The rest of the address on one line: "1 The Embarcadero, San Francisco, California". */
  address: string
  lat: number
  lng: number
}

export interface PlacesProvider {
  /** Places matching what has been typed so far. Rejects on network failure; aborts with `signal`. */
  search(query: string, signal?: AbortSignal): Promise<Place[]>
}
