"use client"

import { Icon, PillTabs } from "@/components/shared"
import type { VenueRow } from "@/lib/data"

import { FIELD_CONTROL, FormField } from "../common/form-field"
import { useVenue } from "../data/queries"
import type { VenueDraft } from "../venues/venue-draft"
import { VenueLocationStep } from "../venues/venue-location-step"
import { VenueMap } from "../venues/venue-map"

export type VenueMode = "existing" | "new"

const MODES = [
  { value: "existing" as const, label: "Existing venue" },
  { value: "new" as const, label: "New venue" },
]

type EventVenueStepProps = {
  mode: VenueMode
  onMode: (mode: VenueMode) => void
  venues: VenueRow[]
  venueId: string
  onVenueId: (id: string) => void
  draft: VenueDraft
  onDraft: (draft: VenueDraft) => void
}

/** The event's first step: pick a venue it has worked, or find a new one on the map right here. */
export function EventVenueStep({
  mode,
  onMode,
  venues,
  venueId,
  onVenueId,
  draft,
  onDraft,
}: EventVenueStepProps) {
  const chosen = useVenue(mode === "existing" ? venueId || undefined : undefined).data

  return (
    <div className="flex flex-col gap-5">
      <PillTabs
        label="Venue"
        items={MODES}
        value={mode}
        onValueChange={onMode}
        className="self-start"
      />
      {mode === "new" ? (
        <VenueLocationStep draft={draft} onChange={onDraft} />
      ) : (
        <>
          <FormField label="Venue" icon="location_on" htmlFor="f-venue">
            <select
              id="f-venue"
              value={venueId}
              onChange={(e) => onVenueId(e.target.value)}
              className={FIELD_CONTROL}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <Icon name="expand_more" size={22} className="text-fg-2" />
          </FormField>
          {chosen && (
            <div className="flex flex-col gap-2">
              <VenueMap
                key={chosen.id}
                lat={chosen.lat}
                lng={chosen.lng}
                radiusM={chosen.radiusM}
                label={`Map of ${chosen.name} with its clock-in area`}
                className="h-60 tablet:h-75"
              />
              <p className="m-0 text-13 leading-x140 text-fg-3">
                {chosen.street} · staff clock in within {chosen.radiusM} m
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
