"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { TenantAccentProvider } from "@/lib/tenant"

import { useSession } from "../data/queries"

/** The tenant's brand color, from what was saved in Settings. */
function AdminAccent({ children }: { children: ReactNode }) {
  const accent = useSession().data?.accent
  return <TenantAccentProvider initial={accent}>{children}</TenantAccentProvider>
}

/** Query cache and the tenant accent for the admin app. */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5000, retry: 1 } } }),
  )
  return (
    <QueryClientProvider client={client}>
      <AdminAccent>{children}</AdminAccent>
    </QueryClientProvider>
  )
}
