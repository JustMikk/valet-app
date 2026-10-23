import Link from "next/link"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

export type NotificationTone = "accent" | "info" | "ok" | "warn"

export type NotificationEntry = {
  id: string
  icon: IconName
  tone: NotificationTone
  title: string
  body: string
  time: string
  href: string
  unread: boolean
}

export type NotificationGroup = { label: string; items: NotificationEntry[] }

const TONE: Record<NotificationTone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
}

type NotificationListProps = {
  groups: NotificationGroup[]
  /** Called when a row is chosen, before navigation (the drawer closes itself here). */
  onOpen?: () => void
  className?: string
}

/** Notification rows grouped by day; each is a link to the screen it is about. */
export function NotificationList({ groups, onOpen, className }: NotificationListProps) {
  if (groups.length === 0) {
    return <p className="m-0 py-10 text-center text-15 text-fg-2">You&rsquo;re all caught up.</p>
  }
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label} className="flex flex-col">
          <h3 className="m-0 py-2 text-13 font-semibold tracking-p040 text-fg-3">{group.label}</h3>
          {group.items.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={onOpen}
              className="flex min-h-18 animate-rise items-center gap-3.5 border-0 border-b border-line bg-transparent py-2.5 text-left text-fg no-underline"
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
                <span className="flex items-center gap-2">
                  <span className="text-16 leading-x130 font-semibold">{n.title}</span>
                  {n.unread && (
                    <span role="img" aria-label="Unread" className="size-2 rounded-pill bg-bad" />
                  )}
                </span>
                <span className="text-14 leading-x135 text-fg-2">{n.body}</span>
              </span>
              <span className="flex-none text-13 font-medium text-fg-3">{n.time}</span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  )
}
