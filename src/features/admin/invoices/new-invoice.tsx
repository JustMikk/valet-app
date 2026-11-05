"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"
import { FIELD_CONTROL, FormField } from "../common/form-field"
import { ErrorNotice } from "../data/query-state"
import { useCreateInvoice, useVenues } from "../data/queries"
import { halfMonth, type Half } from "./half-month"
import { ACTION_BAR } from "./invoice-parts"

const PRESETS: { key: Half; label: string }[] = [
  { key: "last", label: "Last half-month" },
  { key: "this", label: "This half-month" },
]

/** New invoice: pick a venue and a period; the draft is built from the hours approved so far. */
export function NewInvoice() {
  const router = useRouter()
  const venues = useVenues()
  const create = useCreateInvoice()
  const [venueId, setVenueId] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const venue = venueId || venues.data?.[0]?.id || ""
  const ready = Boolean(venue && start && end && end >= start)

  const pick = (half: Half) => {
    const period = halfMonth(new Date(), half)
    setStart(period.start)
    setEnd(period.end)
  }

  return (
    <AdminPage>
      <AdminHead
        title="New invoice"
        sub="Built from approved hours. Hours still in review are left out"
        crumb={{ label: "Invoices", href: "/admin/invoices", current: "New" }}
      />
      <form
        className={cn(FORM, "pb-24 desktop:pb-0")}
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready) return
          create.mutate(
            { venueId: venue, periodStart: start, periodEnd: end },
            { onSuccess: ({ id }) => router.replace(`/admin/invoices/detail?id=${id}`) },
          )
        }}
      >
        <FormField label="Venue" icon="location_on" htmlFor="i-venue">
          <select
            id="i-venue"
            value={venue}
            onChange={(e) => setVenueId(e.target.value)}
            className={FIELD_CONTROL}
          >
            {(venues.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <Icon name="expand_more" size={22} className="text-fg-2" />
        </FormField>
        <div className="flex gap-2.5">
          <FormField label="From" icon="calendar_month" htmlFor="i-start">
            <input
              id="i-start"
              type="date"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
          <FormField label="To" icon="calendar_month" htmlFor="i-end">
            <input
              id="i-end"
              type="date"
              required
              min={start || undefined}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FormField>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => pick(preset.key)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        {create.error && <ErrorNotice message={create.error.message} />}
        <div className={ACTION_BAR}>
          <Button
            type="submit"
            variant="strong"
            className="flex-1 text-17"
            disabled={!ready || create.isPending}
          >
            Create draft
          </Button>
        </div>
      </form>
    </AdminPage>
  )
}
