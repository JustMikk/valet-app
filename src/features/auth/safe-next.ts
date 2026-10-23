import type { Role } from "@/lib/data/api-client"

/** Where a person lands after signing in: where they were headed, if it is inside their app. */
export function landingPath(role: Role, next: string | null): string {
  const home = role === "admin" ? "/admin" : "/staff"
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home
  return next === home || next.startsWith(`${home}/`) || next.startsWith(`${home}?`) ? next : home
}
