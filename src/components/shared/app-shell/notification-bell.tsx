"use client"

import { cn } from "@/lib/utils"

import { Icon } from "../icon"
import { useShellMenu } from "./menu-context"

type NotificationBellProps = {
  unread: number
  /** `glass`: round top-bar control. `rail`: navigation item in the tablet rail / desktop sidebar. */
  variant: "glass" | "rail"
  className?: string
}

const label = (unread: number) => (unread > 0 ? `Notifications, ${unread} unread` : "Notifications")

/** The bell: opens the notification drawer from any page. */
export function NotificationBell({ unread, variant, className }: NotificationBellProps) {
  const { notificationsOpen, setNotificationsOpen } = useShellMenu()
  const toggle = () => setNotificationsOpen(!notificationsOpen)

  if (variant === "glass") {
    return (
      <button
        type="button"
        aria-label={label(unread)}
        aria-haspopup="dialog"
        onClick={toggle}
        className={cn(
          "relative grid size-14 place-items-center rounded-pill border-0 glass text-fg transition-transform duration-160 active:scale-94",
          className,
        )}
      >
        <Icon name="notifications" filled size={24} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-3.25 right-3.5 size-2.5 rounded-pill bg-bad shadow-[0_0_0_2px_var(--elev)]"
          />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label(unread)}
      aria-haspopup="dialog"
      title="Notifications"
      onClick={toggle}
      className={cn(
        "relative flex h-12 items-center justify-center gap-3 rounded-r14 border-0 bg-transparent text-15 font-medium text-fg-2 transition-[background-color,transform] duration-200 active:scale-97 desktop:justify-start desktop:px-3.5",
        className,
      )}
    >
      <Icon name="notifications" filled size={24} />
      <span className="hidden flex-1 text-left desktop:block">Notifications</span>
      {unread > 0 && (
        <span className="absolute top-1 right-2 h-5 min-w-5 rounded-pill bg-bad px-1.5 text-center text-11 leading-5 font-bold text-white desktop:static">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  )
}
