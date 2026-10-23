"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import type { NewVenueRequest, VenueDetail } from "@/lib/data"
import { cn } from "@/lib/utils"

import { FORM } from "../common/admin-page"
import { StepProgress } from "../common/step-progress"
import { ErrorNotice } from "../data/query-state"
import { VenueDetailsStep } from "./venue-details-step"
import { detailsReady, draftFor, hasPlace, requestFrom } from "./venue-draft"
import { VenueLocationStep } from "./venue-location-step"

const STEPS = ["Where is it?", "Details"] as const

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

/**
 * Add or edit a venue in two steps: first find it, see it on the map and set the clock-in radius,
 * then its name, contact, dress code and billing. Back keeps everything typed.
 */
export function VenueForm({
  venue,
  defaultRadiusM,
  submitLabel,
  pending,
  error,
  onSubmit,
}: VenueFormProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(() => draftFor(venue, defaultRadiusM))
  const request = requestFrom(draft)

  return (
    <form
      className={cn(FORM, "gap-6")}
      onSubmit={(e) => {
        e.preventDefault()
        if (step === 0) {
          if (hasPlace(draft)) setStep(1)
        } else if (request) {
          onSubmit(request)
        }
      }}
    >
      <StepProgress steps={STEPS} current={step} />

      {step === 0 ? (
        <VenueLocationStep draft={draft} onChange={setDraft} />
      ) : (
        <VenueDetailsStep draft={draft} onChange={setDraft} />
      )}

      {error && <ErrorNotice message={error} />}
      <div className="flex gap-2.5">
        {step === 1 && (
          <Button
            type="button"
            variant="secondary"
            className="flex-1 text-17"
            onClick={() => setStep(0)}
          >
            Back
          </Button>
        )}
        {step === 0 ? (
          <Button
            type="submit"
            variant="accent"
            className="flex-2 text-17"
            disabled={!hasPlace(draft)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="accent"
            className="flex-2 text-17"
            disabled={!detailsReady(draft) || pending}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
