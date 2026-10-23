import { Suspense } from "react"

import { InvoiceDetail } from "@/features/admin"

export default function Page() {
  return (
    <Suspense>
      <InvoiceDetail />
    </Suspense>
  )
}
