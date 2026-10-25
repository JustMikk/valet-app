"use client"

import type { ReactNode } from "react"

import { TenantAccentProvider } from "@/lib/tenant"

import { useProfile } from "../data/queries"

/** The tenant's brand color for the staff app: whatever the admin saved in Settings. */
export function StaffAccent({ children }: { children: ReactNode }) {
  const accent = useProfile().data?.accent
  return <TenantAccentProvider initial={accent}>{children}</TenantAccentProvider>
}
