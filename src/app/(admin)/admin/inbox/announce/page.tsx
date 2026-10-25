import { Suspense } from "react"

import { Announcement } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <Announcement />
    </Suspense>
  )
}
