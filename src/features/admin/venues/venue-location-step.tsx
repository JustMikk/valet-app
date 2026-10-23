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
const HERE_ACCURACY_M = 30
const HERE_TIMEOUT_MS = 15_000

type Here = { state: "idle" | "reading" | "done" | "failed"; accuracyM?: number }

type LocationStepProps = {
  draft: VenueDraft
  onChange: (next: VenueDraft) => void
}

/** Step 1: find the venue, check it on the map, and set how close staff must be to clock in. */
export function VenueLocationStep({ draft, onChange }: LocationStepProps) {
  const [here, setHere] = useState<Here>({ state: "idle" })
  const pin = pinOf(draft)

  const readThisDevice = async () => {
    setHere({ state: "reading" })
    const outcome = await webLocation.acquire({
      targetAccuracyM: HERE_ACCURACY_M,
      timeoutMs: HERE_TIMEOUT_MS,
    })
    if (!outcome.ok) return setHere({ state: "failed" })
    onChange({
      ...draft,
      lat: outcome.fix.lat.toFixed(6),
      lng: outcome.fix.lng.toFixed(6),
    })
    setHere({ state: "done", accuracyM: Math.round(outcome.fix.accuracyM) })
  }

  return (
    <div className="flex flex-col gap-5">
      <PlaceSearch
        picked={draft.name ? `${draft.name} · search again to change` : undefined}
        onPick={(place) => {
          setHere({ state: "idle" })
          onChange(withPlace(draft, place))
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="xs"
          disabled={here.state === "reading"}
          onClick={() => void readThisDevice()}
        >
          <Icon name="my_location" size={20} />
          {here.state === "reading" ? "Reading location…" : "Use my current location"}
        </Button>
        <span role="status" className="text-13 text-fg-2">
          {here.state === "done" && `Set from this device, accurate to ±${here.accuracyM} m.`}
          {here.state === "failed" && "Couldn’t read this device’s location."}
        </span>
      </div>

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
          Search for the venue above and it will appear on the map.
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
