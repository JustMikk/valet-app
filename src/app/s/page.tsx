import { Suspense } from "react"

import { ShortLink } from "@/features/staff"

/** A text's short link to a shift (ADR-026): forwards to the shift's page. */
export default function ShortLinkPage() {
  return (
    <Suspense>
      <ShortLink />
    </Suspense>
  )
}
