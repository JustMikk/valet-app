import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { Icon } from "../icon"
import { useShellMenu } from "./menu-context"
import { NotificationBell } from "./notification-bell"
import type { ShellApp, ShellBadge, ShellLogo, ShellNavItem, ShellUser } from "./types"

// The two apps differ slightly (Staff PWA.dc.html vs Admin.dc.html): item height, side padding,
// desktop width and the brand block.
const DENSITY = {
  staff: {
    aside: "px-3 py-5 desktop:w-62 desktop:px-4 desktop:py-6",
    logoRow: "pb-3",
    item: "h-12 desktop:px-3.5",
  },
  admin: {
    aside: "px-3 py-5 desktop:w-60 desktop:px-3.5 desktop:py-6",
    logoRow: "pb-3.5",
    item: "h-11.5 desktop:px-3",
  },
} as const

const BADGE_TONE = {
  fg: "bg-fg text-bg",
  warn: "bg-warn text-white",
  bad: "bg-bad text-white",
} as const

function SidebarBadge({ badge }: { badge: ShellBadge }) {
  return (
    <span
      className={cn(
        "absolute top-1 right-2 h-5 min-w-5 rounded-pill px-1.5 text-center text-11 leading-5 font-bold desktop:static",
        BADGE_TONE[badge.tone ?? "fg"],
      )}
    >
      {badge.text}
    </span>
  )
}

type SidebarProps = {
  app: ShellApp
  logo: ShellLogo
  brand: { title: string; subtitle?: string }
  items: ShellNavItem[]
  currentKey: string | null
  user: ShellUser
  /** Unread notifications; undefined draws no bell. */
  unread?: number
  /** The user block opens the account sheet instead of linking to Profile. */
  accountMenu?: boolean
  className?: string
}

/** 84 px icon rail on tablet, 240–248 px labelled sidebar on desktop. Hidden on phone. */
export function Sidebar({
  app,
  logo,
  brand,
  items,
  currentKey,
  user,
  unread,
  accountMenu,
  className,
}: SidebarProps) {
  const { setAccountOpen } = useShellMenu()
  const d = DENSITY[app]
  const avatar = (
    <>
      <span className="grid size-10 flex-none place-items-center rounded-pill bg-surface-2 text-14 font-semibold">
        {user.initials}
      </span>
      <span className="hidden flex-col text-left desktop:flex">
        <span className="text-14 font-semibold">{user.name}</span>
        <span className="text-12 text-fg-2">{user.role}</span>
      </span>
    </>
  )
  const userBlock = cn("flex items-center gap-2.5 p-2", unread === undefined ? "mt-auto" : "mt-1")

  return (
    <aside
      className={cn(
        "relative z-5 hidden w-21 flex-none flex-col gap-1 border-r border-line glass-plain tablet:flex",
        d.aside,
        className,
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-2 pt-1", d.logoRow)}>
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className="h-9 w-auto"
        />
        <span className="hidden flex-col desktop:flex">
          <span
            className={cn(
              "font-semibold tracking-n010",
              brand.subtitle ? "text-16" : "text-18 tracking-normal",
            )}
          >
            {brand.title}
          </span>
          {brand.subtitle && (
            <span className="text-12 font-medium text-fg-2">{brand.subtitle}</span>
          )}
        </span>
      </div>

      {items.map((item) => {
        const on = item.key === currentKey
        return (
          <Link
            key={item.key}
            href={item.href}
            title={item.label}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex items-center justify-center gap-3 rounded-r14 text-15 transition-[background-color,box-shadow,transform] duration-200 active:scale-97 desktop:justify-start",
              d.item,
              on ? "bg-surface-2 font-semibold text-fg" : "font-medium text-fg-2 hover:bg-surface",
            )}
          >
            <Icon name={item.icon} filled size={24} />
            <span className="hidden flex-1 text-left desktop:block">{item.label}</span>
            {item.badge && <SidebarBadge badge={item.badge} />}
          </Link>
        )
      })}

      {unread !== undefined && (
        <NotificationBell unread={unread} variant="rail" className="mt-auto" />
      )}

      {accountMenu ? (
        <button
          type="button"
          aria-label={`Account: ${user.name}`}
          aria-haspopup="dialog"
          onClick={() => setAccountOpen(true)}
          className={cn(userBlock, "w-full rounded-r14 border-0 bg-transparent text-fg")}
        >
          {avatar}
        </button>
      ) : user.href ? (
        <Link href={user.href} className={cn(userBlock, "rounded-r14")}>
          {avatar}
        </Link>
      ) : (
        <div className={userBlock}>{avatar}</div>
      )}
    </aside>
  )
}
