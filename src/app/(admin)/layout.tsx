import type { ReactNode } from "react"

import { AdminSessionProvider, AdminShell } from "@/features/admin"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  )
}
