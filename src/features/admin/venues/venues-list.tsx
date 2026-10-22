"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { VENUES } from "@/mocks/admin"

import { AdminHead, AdminPage, CARD_GRID } from "../common/admin-page"

// Thumbnail ring: radius 100 m → 45 px … 400 m → 120 px.
const ringPx = (radius: number) => Math.round((radius / 400) * 100 + 20)

/** Venues: a card per venue with a geofence thumbnail. */
export function VenuesList() {
  const router = useRouter()

  return (
    <AdminPage>
      <AdminHead
        title="Venues"
        sub="6 venues · default radius 150 m"
        cta={{
          label: "Add venue",
          icon: "add_location_alt",
          onClick: () => router.push("/admin/venues/detail"),
        }}
      />
      <div className={CARD_GRID}>
        {VENUES.map((venue, i) => (
          <Link
            key={venue.id}
            href="/admin/venues/detail"
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex animate-rise flex-col gap-3 rounded-card glass-card p-4.5 text-left text-fg no-underline transition-transform duration-160 active:scale-985"
          >
            <div
              aria-hidden="true"
              className="relative h-30 w-full overflow-hidden rounded-r16 [--map-cell:32px] map-grid"
            >
              <span
                className="absolute top-1/2 left-1/2 -translate-1/2 rounded-pill bg-ok-soft shadow-[inset_0_0_0_2px_var(--ok)]"
                style={{ width: ringPx(venue.radius), height: ringPx(venue.radius) }}
              />
              <span className="absolute top-1/2 left-1/2 -mt-1.5 -ml-1.5 size-3 rounded-r3 bg-fg" />
            </div>
            <div className="flex w-full flex-col gap-0.5">
              <span className="font-display text-20 leading-x120 font-semibold tracking-n020">
                {venue.name}
              </span>
              <span className="text-14 text-fg-2">{venue.address}</span>
            </div>
            <div className="flex w-full justify-between text-14 font-medium text-fg-2">
              <span>Geofence {venue.radius} m</span>
              <span>{venue.upcoming}</span>
            </div>
          </Link>
        ))}
      </div>
    </AdminPage>
  )
}
