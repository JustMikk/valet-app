import { Suspense } from "react"

import { OnboardingFlow } from "@/features/staff"

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  )
}
