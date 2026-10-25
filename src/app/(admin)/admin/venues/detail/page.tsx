import { Suspense } from "react"

import { VenueDetail } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <VenueDetail />
    </Suspense>
  )
}
