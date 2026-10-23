"use client"

import { useState } from "react"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { RADII, type NewVenueRequest, type VenueDetail } from "@/lib/data"
import { webLocation } from "@/lib/platform"

import { FORM } from "../common/admin-page"
import { FIELD_CONTROL, FormField } from "../common/form-field"
import { ErrorNotice } from "../data/query-state"

const RADIUS_ITEMS = RADII.map((r) => ({ value: String(r), label: `${r} m` }))
const HERE_ACCURACY_M = 30
const HERE_TIMEOUT_MS = 15_000

type Here = { state: "idle" | "reading" | "done" | "failed"; accuracyM?: number }

type VenueFormProps = {
  /** An existing venue to edit; omitted when adding. */
  venue?: VenueDetail
  /** The tenant's default clock-in radius, for a new venue. */
  defaultRadiusM: number
  submitLabel: string
  pending: boolean
  error?: string
  onSubmit: (values: NewVenueRequest) => void
}

const money = (cents: number) => (cents / 100).toFixed(2)

/**
 * Venue details: where it is (typed, or read from this device while standing at the stand), the
 * clock-in radius, who staff ask for, dress code and what the venue is billed. Used to add a venue
 * and to edit one.
 */
export function VenueForm({
  venue,
  defaultRadiusM,
  submitLabel,
  pending,
  error,
  onSubmit,
}: VenueFormProps) {
  const [name, setName] = useState(venue?.name ?? "")
  const [street, setStreet] = useState(venue?.street ?? "")
  const [lat, setLat] = useState(venue ? String(venue.lat) : "")
  const [lng, setLng] = useState(venue ? String(venue.lng) : "")
  const [radius, setRadius] = useState(venue?.radiusM ?? defaultRadiusM)
  const [contactName, setContactName] = useState(venue?.contactName ?? "")
  const [contactTel, setContactTel] = useState(venue?.contactTel ?? "")
  const [dress, setDress] = useState(venue?.dress ?? "")
  const [billingEmail, setBillingEmail] = useState(venue?.billingEmail ?? "")
  const [rate, setRate] = useState(venue ? money(venue.billRateCents) : "")
  const [here, setHere] = useState<Here>({ state: "idle" })

  const latitude = Number(lat)
  const longitude = Number(lng)
  const located =
    lat.trim() !== "" && lng.trim() !== "" && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
  const billRate = Number(rate)
  const ready = name.trim() !== "" && street.trim() !== "" && located && billRate >= 0

  const readThisDevice = async () => {
    setHere({ state: "reading" })
    const outcome = await webLocation.acquire({
      targetAccuracyM: HERE_ACCURACY_M,
      timeoutMs: HERE_TIMEOUT_MS,
    })
    if (!outcome.ok) return setHere({ state: "failed" })
    setLat(outcome.fix.lat.toFixed(6))
    setLng(outcome.fix.lng.toFixed(6))
    setHere({ state: "done", accuracyM: Math.round(outcome.fix.accuracyM) })
  }

  return (
    <form
      className={FORM}
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        onSubmit({
          name: name.trim(),
          street: street.trim(),
          lat: latitude,
          lng: longitude,
          radiusM: radius,
          contactName: contactName.trim(),
          contactTel: contactTel.trim(),
          dress: dress.trim(),
          billingEmail: billingEmail.trim(),
          billRateCents: Math.round(billRate * 100),
        })
      }}
    >
      <FormField label="Venue name" icon="location_on" htmlFor="v-name">
        <input
          id="v-name"
          required
          maxLength={80}
          value={name}
          placeholder="The Grand Hotel"
          onChange={(e) => setName(e.target.value)}
          className={FIELD_CONTROL}
        />
      </FormField>
      <FormField label="Street address" icon="home" htmlFor="v-street">
        <input
          id="v-street"
          required
          maxLength={160}
          value={street}
          placeholder="400 Market St, San Francisco"
          onChange={(e) => setStreet(e.target.value)}
          className={FIELD_CONTROL}
        />
      </FormField>

      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <FormField label="Latitude" icon="my_location" htmlFor="v-lat">
            <input
              id="v-lat"
              required
              inputMode="decimal"
              value={lat}
              placeholder="37.7936"
              onChange={(e) => setLat(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
          <FormField label="Longitude" icon="my_location" htmlFor="v-lng">
            <input
              id="v-lng"
              required
              inputMode="decimal"
              value={lng}
              placeholder="-122.3965"
              onChange={(e) => setLng(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
        </div>
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
            {here.state === "failed" &&
              "Couldn’t read this device’s location. Type the coordinates."}
            {here.state === "idle" && "Stand at the valet stand to set the geofence centre."}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-15 font-medium">Clock-in radius</span>
        <PillTabs
          label="Clock-in radius"
          items={RADIUS_ITEMS}
          value={String(radius)}
          onValueChange={(v) => setRadius(Number(v))}
          className="flex-wrap overflow-visible"
        />
      </div>

      <div className="flex gap-2.5">
        <FormField label="Venue contact" icon="person" htmlFor="v-contact">
          <input
            id="v-contact"
            maxLength={80}
            value={contactName}
            placeholder="Priya, front desk"
            onChange={(e) => setContactName(e.target.value)}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Contact phone" icon="call" htmlFor="v-tel">
          <input
            id="v-tel"
            type="tel"
            maxLength={40}
            value={contactTel}
            placeholder="(415) 555-0100"
            onChange={(e) => setContactTel(e.target.value)}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>
      <FormField label="Default dress code" icon="checkroom" htmlFor="v-dress">
        <input
          id="v-dress"
          maxLength={120}
          value={dress}
          placeholder="Black suit"
          onChange={(e) => setDress(e.target.value)}
          className={FIELD_CONTROL}
        />
      </FormField>
      <div className="flex gap-2.5">
        <FormField label="Bill rate ($ / h)" icon="request_quote" htmlFor="v-rate">
          <input
            id="v-rate"
            required
            inputMode="decimal"
            value={rate}
            placeholder="38.00"
            onChange={(e) => setRate(e.target.value)}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Billing email" icon="receipt_long" htmlFor="v-billing">
          <input
            id="v-billing"
            type="email"
            value={billingEmail}
            placeholder="billing@venue.com"
            onChange={(e) => setBillingEmail(e.target.value)}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>

      {error && <ErrorNotice message={error} />}
      <Button type="submit" variant="accent" className="text-17" disabled={!ready || pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
