import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Glass card surface (--card + --blur + --card-line). Radius 22 by default; pass rounded-* to vary. */
export function GlassCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card glass-card", className)} {...props} />
}
