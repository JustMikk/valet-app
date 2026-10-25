"use client"

import { useState } from "react"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { RADII } from "@/lib/data"
import { webLocation } from "@/lib/platform"

import { FIELD_CONTROL, FormField } from "../common/form-field"
import { PlaceSearch } from "./place-search"
import { pinOf, withPlace, type VenueDraft } from "./venue-draft"
import { VenueMap } from "./venue-map"

const RADIUS_ITEMS = RADII.map((r) => ({ value: String(r), label: `${r} m` }))

type GeoState = "idle" | "acquiring" | "error"

const GEO_ERRORS: Record<string, string> = {
  denied: "Location access was denied. Allow it in your browser settings and try again.",
  unavailable: "Couldn't get your location. Check that GPS is on and try again.",
  timeout: "Location timed out. Move to a spot with a clearer signal and try again.",
  unsupported: "Your browser doesn't support location. Use the search or type coordinates.",
}

/** Reverse-geocode a lat/lng to a display name via Nominatim (best-effort). */
async function reverseLookup(lat: number, lng: number): Promise<{ name: string; address: string }> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
      `&format=json&zoom=17&addressdetails=1`
    const res = await fetch(url, { headers: { "Accept-Language": "en" } })
    if (!res.ok) return { name: "Current location", address: "" }
    const json = (await res.json()) as {
      display_name?: string
      name?: string
      address?: { road?: string; house_number?: string; suburb?: string; city?: string }
    }
    const name = json.name ?? json.address?.road ?? "Current location"
    const addr = json.display_name ?? ""
    return { name, address: addr }
  } catch {
    return { name: "Current location", address: "" }
  }
}

type LocationStepProps = {
  draft: VenueDraft
  onChange: (next: VenueDraft) => void
}

/** Step 1: find the venue, check it on the map, and set how close staff must be to clock in. */
export function VenueLocationStep({ draft, onChange }: LocationStepProps) {
  const pin = pinOf(draft)
  const [geoState, setGeoState] = useState<GeoState>("idle")
  const [geoError, setGeoError] = useState<string | null>(null)

  async function handleUseMyLocation() {
    setGeoState("acquiring")
    setGeoError(null)
    const outcome = await webLocation.acquire({
      targetAccuracyM: 30,
      timeoutMs: 12000,
    })
    if (!outcome.ok) {
      setGeoState("error")
      setGeoError(GEO_ERRORS[outcome.reason] ?? "Location unavailable.")
      return
    }
    const { lat, lng } = outcome.fix
    const { name, address } = await reverseLookup(lat, lng)
    onChange(
      withPlace(draft, {
        id: `geo-${lat.toFixed(6)}-${lng.toFixed(6)}`,
        name,
        address,
        lat,
        lng,
      }),
    )
    setGeoState("idle")
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Use my location button */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-13 w-full gap-2 text-16"
          disabled={geoState === "acquiring"}
          onClick={() => void handleUseMyLocation()}
        >
          {geoState === "acquiring" ? (
            <>
              <Icon name="my_location" size={20} className="animate-pulse text-accent-text" />
              Getting your location…
            </>
          ) : (
            <>
              <Icon name="my_location" size={20} className="text-accent-text" />
              Use my current location
            </>
          )}
        </Button>
        {geoState === "error" && geoError && (
          <p className="m-0 flex items-start gap-1.5 text-13 text-bad">
            <Icon name="error" size={15} className="mt-0.5 shrink-0" filled />
            {geoError}
          </p>
        )}
        <div className="flex items-center gap-2 text-13 text-fg-3">
          <span className="h-px flex-1 bg-line" />
          or search
          <span className="h-px flex-1 bg-line" />
        </div>
      </div>

      <PlaceSearch
        picked={draft.name ? `${draft.name} · search again to change` : undefined}
        onPick={(place) => {
          onChange(withPlace(draft, place))
          setGeoState("idle")
          setGeoError(null)
        }}
      />

      {pin ? (
        <div className="flex flex-col gap-2">
          <VenueMap
            lat={pin.lat}
            lng={pin.lng}
            radiusM={draft.radiusM}
            label={`Map of ${draft.name || "the venue"} with its clock-in area`}
            className="h-75 tablet:h-90"
            onMove={(lat, lng) => onChange({ ...draft, lat: lat.toFixed(6), lng: lng.toFixed(6) })}
          />
          <p className="m-0 text-13 leading-x140 text-fg-3">
            Drag the pin to the valet stand. Staff can clock in only inside the green area.
          </p>
        </div>
      ) : (
        <p className="m-0 rounded-r18 bg-surface px-4 py-6 text-center text-15 text-fg-2">
          Use your location above or search for the venue — it will appear on the map.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-15 font-medium">Clock-in radius</span>
          <span className="font-display text-22 font-bold tabular-nums">{draft.radiusM} m</span>
        </div>
        <PillTabs
          label="Clock-in radius"
          items={RADIUS_ITEMS}
          value={String(draft.radiusM)}
          onValueChange={(v) => onChange({ ...draft, radiusM: Number(v) })}
          className="flex-wrap overflow-visible"
        />
        <span className="text-13 text-fg-2">
          150 m suits most hotels. Go wider for big garages or remote lots.
        </span>
      </div>

      <details className="flex flex-col gap-2.5 [&_summary]:cursor-pointer">
        <summary className="text-14 font-medium text-fg-2">Enter coordinates instead</summary>
        <div className="flex gap-2.5 pt-2.5">
          <FormField label="Latitude" icon="my_location" htmlFor="v-lat">
            <input
              id="v-lat"
              inputMode="decimal"
              value={draft.lat}
              placeholder="37.7936"
              onChange={(e) => onChange({ ...draft, lat: e.target.value })}
              className={FIELD_CONTROL}
            />
          </FormField>
          <FormField label="Longitude" icon="my_location" htmlFor="v-lng">
            <input
              id="v-lng"
              inputMode="decimal"
              value={draft.lng}
              placeholder="-122.3965"
              onChange={(e) => onChange({ ...draft, lng: e.target.value })}
              className={FIELD_CONTROL}
            />
          </FormField>
        </div>
      </details>
    </div>
  )
}
