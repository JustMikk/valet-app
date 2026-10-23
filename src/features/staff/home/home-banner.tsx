import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"

import type { StaffBanner } from "../session/staff-session"

type BannerKey = NonNullable<StaffBanner>

export const BANNER_KEYS = ["push", "sync", "install"] as const satisfies readonly BannerKey[]

const BANNER = {
  push: {
    icon: "notifications_off",
    text: "Notifications are off. You may miss shift changes; there is no text backup.",
    tone: "warn",
    to: "/staff/profile",
  },
  sync: {
    icon: "cloud_sync",
    text: "Clock-in saved · will sync when you have signal",
    tone: "neutral",
    to: null,
  },
  install: {
    icon: "install_mobile",
    text: "Add Regency to your Home Screen to get shift alerts",
    tone: "neutral",
    to: "/staff/onboarding",
  },
} as const

type HomeBannerProps = {
  banner: BannerKey
  /** Time the offline clock-in was captured, shown in the sync notice. */
  syncTime?: string
  onOpen: (to: string) => void
}

/** Push-off, pending-sync and install prompts above the hero (Staff Home banners). */
export function HomeBanner({ banner, syncTime, onOpen }: HomeBannerProps) {
  const spec = BANNER[banner]
  const text =
    banner === "sync" && syncTime
      ? `Clock-in saved at ${syncTime} · will sync when you have signal`
      : spec.text
  const classes = cn(
    "flex min-h-13 w-full items-center gap-2.5 rounded-r18 border-0 px-4 py-2.5 text-left text-15 leading-x135 font-semibold",
    spec.tone === "warn" ? "bg-warn-soft text-warn" : "bg-surface text-fg-2",
  )
  const content = (
    <>
      <Icon name={spec.icon} filled size={20} />
      <span className="flex-1">{text}</span>
      <Icon name="chevron_right" size={20} />
    </>
  )
  return spec.to ? (
    <button type="button" className={classes} onClick={() => onOpen(spec.to)}>
      {content}
    </button>
  ) : (
    <div role="status" className={classes}>
      {content}
    </div>
  )
}
