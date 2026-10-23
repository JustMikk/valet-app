"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"
import { StepProgress } from "../common/step-progress"
import { ErrorNotice } from "../data/query-state"
import { useCreateEvent, useCreateVenue, useSettings, useVenues } from "../data/queries"
import { VenueDetailsStep } from "../venues/venue-details-step"
import { detailsReady, draftFor, hasPlace, requestFrom } from "../venues/venue-draft"
import { EventCrewStep, type Crew } from "./event-crew-step"
import { EventVenueStep, type VenueMode } from "./event-venue-step"
import { EventWhenStep, type When } from "./event-when-step"

type Stage = "venue" | "details" | "when" | "crew"

const LABELS: Record<Stage, string> = {
  venue: "Venue",
  details: "Venue details",
  when: "When",
  crew: "Crew",
}

/** A new venue adds one step (its details); an existing one skips it. */
const stagesFor = (mode: VenueMode): Stage[] =>
  mode === "new" ? ["venue", "details", "when", "crew"] : ["venue", "when", "crew"]

/**
 * New event in steps: the venue (pick one, or find and add a new one on the map without leaving),
 * its details when new, when it happens, then the crew. Back keeps everything typed.
 */
export function NewEvent() {
  const defaultRadiusM = useSettings().data?.rules.radiusM ?? 150
  // The default radius arrives with settings: remount once so a new venue starts from it.
  return <EventWizard key={defaultRadiusM} defaultRadiusM={defaultRadiusM} />
}

function EventWizard({ defaultRadiusM }: { defaultRadiusM: number }) {
  const router = useRouter()
  const venues = useVenues()
  const createVenue = useCreateVenue()
  const createEvent = useCreateEvent()

  const [stage, setStage] = useState<Stage>("venue")
  const [chosenMode, setMode] = useState<VenueMode>("existing")
  const [venueId, setVenueId] = useState("")
  const [venueDraft, setVenueDraft] = useState(() => draftFor(undefined, defaultRadiusM))
  const [when, setWhen] = useState<When>({ date: "", start: "10:00", end: "15:00", name: "" })
  const [crew, setCrew] = useState<Crew>({ need: 8, instructions: "", fill: "open" })

  const list = venues.data ?? []
  // With no venues yet, adding one is the only way forward.
  const mode: VenueMode = venues.data && list.length === 0 ? "new" : chosenMode
  const venue = venueId || list[0]?.id || ""
  const stages = stagesFor(mode)
  const venueRequest = requestFrom(venueDraft)
  const whenReady = Boolean(when.date && when.start && when.end && when.name.trim())

  const canContinue =
    stage === "venue"
      ? mode === "new"
        ? hasPlace(venueDraft)
        : Boolean(venue)
      : stage === "details"
        ? detailsReady(venueDraft) && !createVenue.isPending
        : stage === "when"
          ? whenReady
          : whenReady && Boolean(venue) && !createEvent.isPending

  const goBack = () => {
    if (stage === "details") setStage("venue")
    else if (stage === "when") setStage(mode === "new" ? "details" : "venue")
    else if (stage === "crew") setStage("when")
  }

  const addVenue = () => {
    if (!venueRequest) return
    createVenue.mutate(venueRequest, {
      onSuccess: (created) => {
        // From here on the new venue is a venue like any other: selected, on the map, in the list.
        setVenueId(created.id)
        setMode("existing")
        setVenueDraft(draftFor(undefined, defaultRadiusM))
        setStage("when")
      },
    })
  }

  const publish = (publishNow: boolean) =>
    createEvent.mutate(
      {
        venueId: venue,
        date: when.date,
        start: when.start,
        end: when.end,
        name: when.name.trim(),
        headcount: crew.need,
        instructions: crew.instructions.trim() || undefined,
        fill: crew.fill,
        publish: publishNow,
      },
      {
        onSuccess: ({ id }) =>
          router.push(
            publishNow && crew.fill === "assign"
              ? `/admin/events/detail?id=${id}&fill=1`
              : publishNow
                ? `/admin/events/detail?id=${id}`
                : "/admin/events",
          ),
      },
    )

  const next = () => {
    if (!canContinue) return
    if (stage === "venue") setStage(mode === "new" ? "details" : "when")
    else if (stage === "details") addVenue()
    else if (stage === "when") setStage("crew")
    else publish(true)
  }

  const error =
    stage === "details" ? createVenue.error : stage === "crew" ? createEvent.error : null

  return (
    <AdminPage>
      <AdminHead title="New event" sub="Spots you don’t assign are posted as open shifts" />
      <form
        className={`${FORM} gap-6`}
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <StepProgress steps={stages.map((s) => LABELS[s])} current={stages.indexOf(stage)} />

        {stage === "venue" && (
          <EventVenueStep
            mode={mode}
            onMode={setMode}
            venues={list}
            venueId={venue}
            onVenueId={setVenueId}
            draft={venueDraft}
            onDraft={setVenueDraft}
          />
        )}
        {stage === "details" && <VenueDetailsStep draft={venueDraft} onChange={setVenueDraft} />}
        {stage === "when" && <EventWhenStep value={when} onChange={setWhen} />}
        {stage === "crew" && <EventCrewStep value={crew} onChange={setCrew} />}

        {error && <ErrorNotice message={error.message} />}
        <div className="flex gap-2.5">
          {stage !== "venue" && (
            <Button type="button" variant="secondary" className="flex-1 text-17" onClick={goBack}>
              Back
            </Button>
          )}
          {stage === "crew" && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-17"
              disabled={!canContinue}
              onClick={() => publish(false)}
            >
              Save draft
            </Button>
          )}
          <Button type="submit" variant="accent" className="flex-2 text-17" disabled={!canContinue}>
            {stage === "crew" ? "Publish event" : stage === "details" ? "Add venue" : "Continue"}
          </Button>
        </div>
      </form>
    </AdminPage>
  )
}
