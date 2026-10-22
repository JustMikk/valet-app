import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import type { StatusSpec } from "@/lib/status/presets"

import { Icon } from "./icon"

type StatusBadgeProps = {
  status: StatusSpec
  /** Replaces the preset's words, e.g. an elapsed time on an "On site" badge. */
  children?: ReactNode
  size?: "md" | "sm"
  className?: string
}

/** Status pill: tone + glyph + words, so status never relies on color alone. */
export function StatusBadge({ status, children, size = "md", className }: StatusBadgeProps) {
  return (
    <Badge tone={status.tone} size={size} className={className}>
      <Icon name={status.icon} filled={status.filled} size={size === "md" ? 18 : 16} />
      {children ?? status.label}
    </Badge>
  )
}
