"use client"

import { useRouter } from "next/navigation"

import { AdminHead, AdminPage } from "../common/admin-page"
import { useCreateVenue, useSettings } from "../data/queries"
import { VenueForm } from "./venue-form"

/** Add a venue: its place, geofence, contact and billing, then straight to its detail page. */
export function NewVenue() {
  const router = useRouter()
  const create = useCreateVenue()
  const defaultRadiusM = useSettings().data?.rules.radiusM ?? 150

  return (
    <AdminPage>
      <AdminHead title="Add venue" sub="Staff can clock in only inside its geofence" />
      <VenueForm
        // The default radius arrives with settings: remount once so the form starts from it.
        key={defaultRadiusM}
        defaultRadiusM={defaultRadiusM}
        submitLabel="Add venue"
        pending={create.isPending}
        error={create.error?.message}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (venue) => router.replace(`/admin/venues/detail?id=${venue.id}`),
          })
        }
      />
    </AdminPage>
  )
}
