import type { NewVenueRequest, VenueDetail } from "@/lib/data"
import type { Place } from "@/lib/places"

/** The venue form's fields as typed (strings), before they become a request. */
export type VenueDraft = {
  name: string
  street: string
  lat: string
  lng: string
  radiusM: number
  contactName: string
  contactTel: string
  dress: string
  billingEmail: string
  rate: string
}

const money = (cents: number) => (cents / 100).toFixed(2)

export function draftFor(venue: VenueDetail | undefined, defaultRadiusM: number): VenueDraft {
  return {
    name: venue?.name ?? "",
    street: venue?.street ?? "",
    lat: venue ? String(venue.lat) : "",
    lng: venue ? String(venue.lng) : "",
    radiusM: venue?.radiusM ?? defaultRadiusM,
    contactName: venue?.contactName ?? "",
    contactTel: venue?.contactTel ?? "",
    dress: venue?.dress ?? "",
    billingEmail: venue?.billingEmail ?? "",
    rate: venue ? money(venue.billRateCents) : "",
  }
}

/** The draft with a searched place applied: its name, address and coordinates. */
export function withPlace(draft: VenueDraft, place: Place): VenueDraft {
  return {
    ...draft,
    name: place.name,
    street: place.address || place.name,
    lat: place.lat.toFixed(6),
    lng: place.lng.toFixed(6),
  }
}

/** The pin's position when both coordinates are valid, otherwise null. */
export function pinOf(draft: VenueDraft): { lat: number; lng: number } | null {
  if (draft.lat.trim() === "" || draft.lng.trim() === "") return null
  const lat = Number(draft.lat)
  const lng = Number(draft.lng)
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

export const hasPlace = (draft: VenueDraft) => pinOf(draft) !== null

export const detailsReady = (draft: VenueDraft) =>
  draft.name.trim() !== "" &&
  draft.street.trim() !== "" &&
  Number(draft.rate) >= 0 &&
  draft.rate !== ""

/** The request for a finished draft; null while a required field is missing. */
export function requestFrom(draft: VenueDraft): NewVenueRequest | null {
  const pin = pinOf(draft)
  if (!pin || !detailsReady(draft)) return null
  return {
    name: draft.name.trim(),
    street: draft.street.trim(),
    lat: pin.lat,
    lng: pin.lng,
    radiusM: draft.radiusM,
    contactName: draft.contactName.trim(),
    contactTel: draft.contactTel.trim(),
    dress: draft.dress.trim(),
    billingEmail: draft.billingEmail.trim(),
    billRateCents: Math.round(Number(draft.rate) * 100),
  }
}
