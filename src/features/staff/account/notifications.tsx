"use client"

import { useRouter } from "next/navigation"

import { Icon, PageContainer, PageTitle } from "@/components/shared"
import { cn } from "@/lib/utils"
import { NOTIFICATION_GROUPS, type NotificationTone } from "@/mocks/staff"

const TONE: Record<NotificationTone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
}

/** Notification center: grouped by day, each row deep-links to its screen. */
export function Notifications() {
  const router = useRouter()
  return (
    <PageContainer className="max-w-180 tablet:pb-12 desktop:pb-12">
      <div className="flex flex-col gap-3">
        <PageTitle>Notifications</PageTitle>
        {NOTIFICATION_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="py-2 text-13 font-semibold tracking-p040 text-fg-3">
              {group.label}
            </span>
            {group.items.map((n) => (
              <button
                key={n.title}
                type="button"
                onClick={() => router.push(n.href)}
                className="flex min-h-18 animate-rise items-center gap-3.5 border-0 border-b border-line bg-transparent py-2.5 text-left text-fg"
              >
                <span
                  className={cn(
                    "grid size-11 flex-none place-items-center rounded-pill",
                    TONE[n.tone],
                  )}
                >
                  <Icon name={n.icon} filled size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                  <span className="text-16 leading-x130 font-semibold">{n.title}</span>
                  <span className="text-14 leading-x135 text-fg-2">{n.body}</span>
                </span>
                <span className="flex-none text-13 font-medium text-fg-3">{n.time}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
