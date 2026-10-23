import { Suspense } from "react"

import { EditVenue } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <EditVenue />
    </Suspense>
  )
}
