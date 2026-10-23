"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { RADII, type VenueDetail as VenueData } from "@/lib/data"
import { formatRate } from "@/lib/money/format"

import { AdminPage, SPLIT } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useUpdateVenue, useVenue } from "../data/queries"

const RADIUS_ITEMS = RADII.map((r) => ({ value: String(r), label: `${r} m` }))
// The ring spans 40 px at 0 m up to full map size at 400 m (260 px phone, 380 px wide).
const ringPx = (radius: number, phone: boolean) =>
  Math.round((Math.min(radius, 400) / 400) * (phone ? 260 : 380) + 40)

/** One venue: geofence map with live radius preview, radius presets and billing facts. */
export function VenueDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const venue = useVenue(id)
  return (
    <AdminPage>
      <QueryState query={venue} rows={3}>
        {(data) => <VenueBody key={`${data.id}-${data.radiusM}`} venue={data} />}
      </QueryState>
    </AdminPage>
  )
}

function VenueBody({ venue }: { venue: VenueData }) {
  const router = useRouter()
  const phone = useBreakpoint() === "phone"
  const update = useUpdateVenue()
  const [radius, setRadius] = useState(venue.radiusM)
  const ring = ringPx(radius, phone)

  return (
    <div className={SPLIT}>
      <div className="flex flex-col gap-3.5">
        <div className="relative h-75 overflow-hidden rounded-r24 [--map-cell:40px] map-grid tablet:h-110">
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-1/2 rounded-pill bg-ok-soft shadow-[inset_0_0_0_2px_var(--ok)] transition-[width,height] duration-300 ease-knob"
            style={{ width: ring, height: ring }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -mt-2.25 -ml-2.25 size-4.5 rounded-r4 bg-fg shadow-[0_0_0_4px_var(--bg)]"
          />
          <span className="absolute bottom-3.5 left-4 flex h-8 items-center rounded-pill glass px-3 text-13 font-semibold">
            Drag pin to the valet stand
          </span>
        </div>
        <p className="m-0 text-14 leading-x145 text-fg-3">
          Staff can clock in only inside the green area. Outside it, they can request your approval.
        </p>
      </div>

      <div className="flex flex-col gap-4.5">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-34 leading-x105 font-bold tracking-n030">
            {venue.name}
          </h1>
          <span className="text-15 text-fg-2">{venue.address}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-16 font-medium">Clock-in radius</span>
            <span className="font-display text-26 font-bold tabular-nums">{radius} m</span>
          </div>
          <PillTabs
            label="Clock-in radius"
            items={RADIUS_ITEMS}
            value={String(radius)}
            onValueChange={(v) => setRadius(Number(v))}
            className="flex-wrap overflow-visible"
          />
          <span className="text-13 text-fg-2">
            150 m suits most hotels. Go wider for big garages or remote lots.
          </span>
        </div>
        <dl className="m-0 flex flex-col border-t border-line">
          {[
            { k: "Venue contact", v: venue.contact },
            { k: "Default dress code", v: venue.dress },
          ].map((row) => (
            <div
              key={row.k}
              className="box-content flex min-h-14.5 items-center border-b border-line"
            >
              <dt className="flex-1 text-16">{row.k}</dt>
              <dd className="m-0 text-15 font-medium text-fg-2">{row.v}</dd>
            </div>
          ))}
          <div className="box-content flex min-h-14.5 items-center border-b border-line">
            <dt className="flex-1 text-16">Bill rate</dt>
            <dd className="m-0 font-mono text-15 font-semibold">
              {formatRate(venue.billRateCents)}
            </dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          className="gap-2 text-16"
          nativeButton={false}
          render={<Link href={`/admin/venues/edit?id=${venue.id}`} />}
        >
          <Icon name="edit" size={22} />
          Edit details
        </Button>
        {update.error && <ErrorNotice message={update.error.message} />}
        <Button
          variant="strong"
          className="text-17"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { id: venue.id, patch: { radiusM: radius } },
              { onSuccess: () => router.back() },
            )
          }
        >
          Save venue
        </Button>
      </div>
    </div>
  )
}
