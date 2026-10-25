"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { AdminHead, AdminPage } from "../common/admin-page"
import { QueryState } from "../data/query-state"
import { useUpdateVenue, useVenue } from "../data/queries"
import { VenueForm } from "./venue-form"

/** Edit a venue's details. `?id=` picks it. Events already created keep the contact they copied. */
export function EditVenue() {
  const router = useRouter()
  const id = useSearchParams().get("id") ?? undefined
  const venue = useVenue(id)
  const update = useUpdateVenue()

  return (
    <AdminPage>
      <QueryState query={venue} rows={3}>
        {(data) => (
          <>
            <AdminHead title="Edit venue" sub={data.name} />
            <VenueForm
              venue={data}
              defaultRadiusM={data.radiusM}
              submitLabel="Save changes"
              pending={update.isPending}
              error={update.error?.message}
              onSubmit={(patch) =>
                update.mutate(
                  { id: data.id, patch },
                  { onSuccess: () => router.replace(`/admin/venues/detail?id=${data.id}`) },
                )
              }
            />
          </>
        )}
      </QueryState>
    </AdminPage>
  )
}
