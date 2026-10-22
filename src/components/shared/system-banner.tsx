import type { ReactNode } from "react"
import { cva } from "class-variance-authority"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

const bannerVariants = cva(
  "flex min-h-11 items-center gap-2 rounded-pill px-4 text-15 font-semibold",
  {
    variants: {
      tone: {
        warn: "bg-warn-soft text-warn",
        neutral: "bg-surface text-fg",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

type SystemBannerProps = {
  tone?: "warn" | "neutral"
  icon: IconName
  children: ReactNode
  className?: string
}

/** Offline / sync / stale notice (Design System "system-banner"); a polite live status. */
export function SystemBanner({ tone = "neutral", icon, children, className }: SystemBannerProps) {
  return (
    <div role="status" className={cn(bannerVariants({ tone }), className)}>
      <Icon
        name={icon}
        size={20}
        filled={tone === "warn"}
        className={tone === "neutral" ? "text-fg-2" : undefined}
      />
      {children}
    </div>
  )
}
