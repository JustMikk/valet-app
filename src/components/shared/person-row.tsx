import type { ReactNode } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

type PersonAvatarProps =
  | { name: string; open?: false; className?: string }
  | { open: true; name?: undefined; className?: string }

/** 44 px initials avatar, or the outlined "open slot" placeholder. */
export function PersonAvatar({ name, open, className }: PersonAvatarProps) {
  if (open) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-pill text-fg-2 shadow-[inset_0_0_0_1.5px_var(--fg-3-line)]",
          className,
        )}
      >
        <Icon name="person_add" size={22} />
      </span>
    )
  }
  return (
    <Avatar className={cn("size-11 after:hidden", className)}>
      <AvatarFallback className="bg-surface-2 text-15 font-semibold text-fg">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

type PersonRowProps = {
  avatar: ReactNode
  name: string
  /** Evidence line: punch time, distance, accuracy. */
  detail?: ReactNode
  /** Status badge or inline action. */
  trailing?: ReactNode
  className?: string
}

/** 72 px row for a person in a slot: avatar, name, evidence, state. */
export function PersonRow({ avatar, name, detail, trailing, className }: PersonRowProps) {
  return (
    <div
      className={cn(
        "box-content flex min-h-18 items-center gap-3.5 border-b border-line",
        className,
      )}
    >
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span className="text-17 font-semibold">{name}</span>
        {detail && <span className="text-14 text-fg-2">{detail}</span>}
      </div>
      {trailing}
    </div>
  )
}
