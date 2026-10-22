import type { ReactNode } from "react"

import { StaffSessionProvider, StaffShell } from "@/features/staff"

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffSessionProvider>
      <StaffShell>{children}</StaffShell>
    </StaffSessionProvider>
  )
}
