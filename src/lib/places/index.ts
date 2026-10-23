import { photon } from "./photon"

export { parsePlaces } from "./photon"
export type { Place, PlacesProvider } from "./types"

/** The place-search provider the app uses. */
export const places = photon
