import type { ReactNode } from "react"

import { StaffAccent, StaffSessionProvider, StaffShell } from "@/features/staff"

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffSessionProvider>
      <StaffAccent>
        <StaffShell>{children}</StaffShell>
      </StaffAccent>
    </StaffSessionProvider>
  )
}
