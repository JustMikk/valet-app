import { Suspense } from "react"

import { ValetPerformance } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <ValetPerformance />
    </Suspense>
  )
}
