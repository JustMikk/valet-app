import { Suspense } from "react"

import { OpenShifts } from "@/features/staff"

export default function OpenShiftsPage() {
  return (
    <Suspense>
      <OpenShifts />
    </Suspense>
  )
}
