import { Suspense } from "react"

import { StaffHome } from "@/features/staff"

export default function StaffHomePage() {
  return (
    <Suspense>
      <StaffHome />
    </Suspense>
  )
}
