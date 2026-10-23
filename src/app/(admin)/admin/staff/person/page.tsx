import { Suspense } from "react"

import { PersonDetail } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <PersonDetail />
    </Suspense>
  )
}
