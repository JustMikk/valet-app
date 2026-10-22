import { Suspense } from "react"

import { ClockFlow } from "@/features/staff"

export default function ClockPage() {
  return (
    <Suspense>
      <ClockFlow />
    </Suspense>
  )
}
