import type { Metadata } from "next"

import { DesignSystemShowcase } from "@/features/design-system"

// Development reference (D9): shipped in the static export, kept out of search and navigation.
export const metadata: Metadata = {
  title: "Design System · Valet Workforce",
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return <DesignSystemShowcase />
}
