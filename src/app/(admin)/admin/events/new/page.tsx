import { Suspense } from "react"

import { NewEvent } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <NewEvent />
    </Suspense>
  )
}
