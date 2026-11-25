"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

/** Where a text's short link (/s?i=<assignment id>) leads: that shift, or the shifts list. */
export function shortLinkTarget(id: string | null): string {
  return id && /^[\w-]+$/.test(id)
    ? `/staff/shifts/detail?id=${encodeURIComponent(id)}`
    : "/staff/shifts"
}

/** Forwards a text's short link to the shift's page (ADR-026). Renders nothing. */
export function ShortLink() {
  const router = useRouter()
  const id = useSearchParams().get("i")
  useEffect(() => {
    router.replace(shortLinkTarget(id))
  }, [router, id])
  return null
}
