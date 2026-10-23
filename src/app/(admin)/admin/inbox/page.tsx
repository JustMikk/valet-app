import { Suspense } from "react"

import { AdminInbox } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <AdminInbox />
    </Suspense>
  )
}
