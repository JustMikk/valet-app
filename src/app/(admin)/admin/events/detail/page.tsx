import { Suspense } from "react"

import { EventDetail } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <EventDetail />
    </Suspense>
  )
}
