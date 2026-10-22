import type { ReactNode } from "react"

import { AdminShell } from "@/features/admin"
import { TenantAccentProvider } from "@/lib/tenant"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TenantAccentProvider>
      <AdminShell>{children}</AdminShell>
    </TenantAccentProvider>
  )
}
