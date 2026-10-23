"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Icon, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import type { FillMode } from "@/lib/data"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"
import { FIELD_CONTROL, FormField } from "../common/form-field"
import { ErrorNotice, ScreenSkeleton } from "../data/query-state"
import { useCreateEvent, useVenues } from "../data/queries"
import { clearDraft, readDraft, saveDraft } from "./event-draft"
import { FillModePicker } from "./fill-mode-picker"
import { HeadcountStepper } from "./headcount-stepper"

const NEW_VENUE = "__new__"

/** New event: reads back a draft left while adding a venue, once the browser has hydrated. */
export function NewEvent() {
  const hydrated = useHydrated()
  const fromUrl = useSearchParams().get("venue") ?? ""
  if (!hydrated) {
    return (
      <AdminPage>
        <ScreenSkeleton rows={3} />
      </AdminPage>
    )
  }
  return <EventForm newVenueId={fromUrl} />
}

/** The form: venue, date, time, name, headcount, instructions and how to fill. */
function EventForm({ newVenueId }: { newVenueId: string }) {
  const router = useRouter()
  // Read once, on mount (the form only mounts after hydration, so storage is safe to read here).
  const [initial] = useState(readDraft)
  useEffect(() => clearDraft(), [])
  const venues = useVenues()
  const create = useCreateEvent()
  const [venueId, setVenueId] = useState(newVenueId || initial.venueId)
  const [date, setDate] = useState(initial.date)
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [name, setName] = useState(initial.name)
  const [need, setNeed] = useState(initial.need)
  const [instructions, setInstructions] = useState(initial.instructions)
  const [fill, setFill] = useState<FillMode>(initial.fill)

  /** Leaves for the Add venue steps, keeping what was typed; the new venue comes back selected. */
  const addVenue = () => {
    saveDraft({ venueId: "", date, start, end, name, need, instructions, fill })
    router.push("/admin/venues/new?return=/admin/events/new")
  }

  const venue = venueId || venues.data?.[0]?.id || ""
  const ready = Boolean(venue && date && start && end && name.trim())

  const submit = (publish: boolean) =>
    create.mutate(
      {
        venueId: venue,
        date,
        start,
        end,
        name: name.trim(),
        headcount: need,
        instructions: instructions.trim() || undefined,
        fill,
        publish,
      },
      {
        onSuccess: ({ id }) =>
          router.push(
            publish && fill === "assign"
              ? `/admin/events/detail?id=${id}&fill=1`
              : publish
                ? `/admin/events/detail?id=${id}`
                : "/admin/events",
          ),
      },
    )

  return (
    <AdminPage>
      <AdminHead title="New event" sub="Spots you don’t assign are posted as open shifts" />
      <form
        className={FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) submit(true)
        }}
      >
        <FormField label="Venue" icon="location_on" htmlFor="f-venue">
          <select
            id="f-venue"
            value={venue}
            onChange={(e) =>
              e.target.value === NEW_VENUE ? addVenue() : setVenueId(e.target.value)
            }
            className={FIELD_CONTROL}
          >
            {(venues.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
            <option value={NEW_VENUE}>+ Add a new venue…</option>
          </select>
          <Icon name="expand_more" size={22} className="text-fg-2" />
        </FormField>
        <FormField label="Date" icon="calendar_month" htmlFor="f-date">
          <input
            id="f-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={FIELD_CONTROL}
          />
        </FormField>
        <div className="flex gap-2.5">
          <FormField label="Starts" icon="schedule" htmlFor="f-start">
            <input
              id="f-start"
              type="time"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
          <FormField label="Ends" icon="schedule" htmlFor="f-end">
            <input
              id="f-end"
              type="time"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
        </div>
        <FormField label="Event name" icon="edit" htmlFor="f-name">
          <input
            id="f-name"
            required
            maxLength={80}
            value={name}
            placeholder="Sunday brunch"
            onChange={(e) => setName(e.target.value)}
            className={cn(FIELD_CONTROL, "placeholder:text-fg-3")}
          />
        </FormField>

        <HeadcountStepper value={need} onChange={setNeed} />

        <TextField
          label="Instructions"
          multiline
          rows={3}
          maxLength={1000}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Dress code, who to report to, where staff park"
        />

        <FillModePicker value={fill} onChange={setFill} />

        {create.error && <ErrorNotice message={create.error.message} />}
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 text-17"
            disabled={!ready || create.isPending}
            onClick={() => submit(false)}
          >
            Save draft
          </Button>
          <Button
            type="submit"
            variant="accent"
            className="flex-2 text-17"
            disabled={!ready || create.isPending}
          >
            Publish event
          </Button>
        </div>
      </form>
    </AdminPage>
  )
}
