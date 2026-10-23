"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Icon, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { FillMode } from "@/lib/data"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"
import { ErrorNotice } from "../data/query-state"
import { useCreateEvent, useVenues } from "../data/queries"

const FILL_MODES = [
  { key: "open", label: "Post as open shifts", note: "First to claim gets it", icon: "bolt" },
  {
    key: "assign",
    label: "Assign people now",
    note: "Pick names; the rest post as open",
    icon: "how_to_reg",
  },
] as const satisfies readonly { key: FillMode; label: string; note: string; icon: IconName }[]

const MIN_STAFF = 1
const MAX_STAFF = 40
const STEP =
  "grid size-11 place-items-center rounded-pill border-0 bg-surface text-fg transition-transform duration-160 active:scale-90 disabled:text-fg-3"
const CONTROL = "min-w-0 flex-1 border-0 bg-transparent p-0 text-17 text-fg outline-none"

function Field({ label, icon, htmlFor, children }: FieldProps) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-15 font-medium">
        {label}
      </label>
      <div className="flex h-14 items-center gap-2.5 rounded-field bg-surface px-4 text-17">
        <Icon name={icon} size={22} className="text-fg-2" />
        {children}
      </div>
    </div>
  )
}
type FieldProps = { label: string; icon: IconName; htmlFor: string; children: ReactNode }

/** New event form: venue, date, time, name, headcount, instructions and how to fill. */
export function NewEvent() {
  const router = useRouter()
  const venues = useVenues()
  const create = useCreateEvent()
  const [venueId, setVenueId] = useState("")
  const [date, setDate] = useState("")
  const [start, setStart] = useState("10:00")
  const [end, setEnd] = useState("15:00")
  const [name, setName] = useState("")
  const [need, setNeed] = useState(8)
  const [instructions, setInstructions] = useState("")
  const [fill, setFill] = useState<FillMode>("open")

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
        <Field label="Venue" icon="location_on" htmlFor="f-venue">
          <select
            id="f-venue"
            value={venue}
            onChange={(e) => setVenueId(e.target.value)}
            className={CONTROL}
          >
            {(venues.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <Icon name="expand_more" size={22} className="text-fg-2" />
        </Field>
        <Field label="Date" icon="calendar_month" htmlFor="f-date">
          <input
            id="f-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={CONTROL}
          />
        </Field>
        <div className="flex gap-2.5">
          <Field label="Starts" icon="schedule" htmlFor="f-start">
            <input
              id="f-start"
              type="time"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={CONTROL}
            />
          </Field>
          <Field label="Ends" icon="schedule" htmlFor="f-end">
            <input
              id="f-end"
              type="time"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={CONTROL}
            />
          </Field>
        </div>
        <Field label="Event name" icon="edit" htmlFor="f-name">
          <input
            id="f-name"
            required
            maxLength={80}
            value={name}
            placeholder="Sunday brunch"
            onChange={(e) => setName(e.target.value)}
            className={cn(CONTROL, "placeholder:text-fg-3")}
          />
        </Field>

        <div className="box-content flex min-h-16 items-center justify-between border-y border-line">
          <div className="flex flex-col gap-0.5">
            <span className="text-17 font-medium">Staff needed</span>
            <span className="text-13 text-fg-2">Unassigned spots post as open shifts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Fewer staff"
              disabled={need <= MIN_STAFF}
              onClick={() => setNeed((n) => Math.max(MIN_STAFF, n - 1))}
              className={STEP}
            >
              <Icon name="remove" size={22} />
            </button>
            <output
              aria-live="polite"
              className="w-11 text-center font-display text-26 font-bold tabular-nums"
            >
              {need}
            </output>
            <button
              type="button"
              aria-label="More staff"
              disabled={need >= MAX_STAFF}
              onClick={() => setNeed((n) => Math.min(MAX_STAFF, n + 1))}
              className={STEP}
            >
              <Icon name="add" size={22} />
            </button>
          </div>
        </div>

        <TextField
          label="Instructions"
          multiline
          rows={3}
          maxLength={1000}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Dress code, who to report to, where staff park"
        />

        <div role="radiogroup" aria-label="How to fill" className="flex flex-col gap-2">
          <span className="text-15 font-medium">How to fill</span>
          {FILL_MODES.map((mode) => {
            const on = fill === mode.key
            return (
              <button
                key={mode.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFill(mode.key)}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-field border-0 px-4 text-left text-fg transition-[background-color,box-shadow] duration-200",
                  on
                    ? "bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--accent)]"
                    : "bg-surface shadow-none",
                )}
              >
                <Icon name={mode.icon} filled size={22} />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-16 font-semibold">{mode.label}</span>
                  <span className="text-13 text-fg-2">{mode.note}</span>
                </span>
              </button>
            )
          })}
        </div>

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
