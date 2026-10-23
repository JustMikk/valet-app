import { Suspense } from "react"

import { NewVenue } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <NewVenue />
    </Suspense>
  )
}
