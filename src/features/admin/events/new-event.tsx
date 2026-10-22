"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FILL_MODES, NEW_EVENT_FIELDS, type FillMode } from "@/mocks/admin"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"

const MIN_STAFF = 1
const MAX_STAFF = 40
const STEP =
  "grid size-11 place-items-center rounded-pill border-0 bg-surface text-fg transition-transform duration-160 active:scale-90 disabled:text-fg-3"

/** New event form: venue, date, time, name, headcount, instructions and how to fill. */
export function NewEvent() {
  const router = useRouter()
  const [need, setNeed] = useState(8)
  const [fill, setFill] = useState<FillMode>("open")

  return (
    <AdminPage>
      <AdminHead title="New event" sub="Spots you don’t assign are posted as open shifts" />
      <form
        className={FORM}
        onSubmit={(e) => {
          e.preventDefault()
          router.push("/admin/events/detail")
        }}
      >
        {NEW_EVENT_FIELDS.map((field) => (
          <div key={field.label} className="flex flex-col gap-2">
            <label htmlFor={`f-${field.label}`} className="text-15 font-medium">
              {field.label}
            </label>
            <div className="flex h-14 items-center gap-2.5 rounded-field bg-surface px-4 text-17">
              <Icon name={field.icon} size={22} className="text-fg-2" />
              <input
                id={`f-${field.label}`}
                defaultValue={field.value}
                readOnly={field.chevron}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-17 text-fg outline-none"
              />
              {field.chevron && <Icon name="expand_more" size={22} className="text-fg-2" />}
            </div>
          </div>
        ))}

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

        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 text-17"
            onClick={() => router.push("/admin/events")}
          >
            Save draft
          </Button>
          <Button type="submit" variant="accent" className="flex-2 text-17">
            Publish event
          </Button>
        </div>
      </form>
    </AdminPage>
  )
}
