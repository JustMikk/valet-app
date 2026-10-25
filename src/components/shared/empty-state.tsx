import type { ReactNode } from "react"

import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type EmptyStateProps = {
  icon: IconName
  title: string
  children?: ReactNode
  /** The one thing to do next (a button or link). */
  action?: ReactNode
  className?: string
}

/** A screen with nothing to show yet: what it is for, why it is empty, and what to do about it. */
export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex animate-rise flex-col items-center gap-3 rounded-card bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-pill bg-accent-soft text-accent"
      >
        <Icon name={icon} filled size={32} />
      </span>
      <h2 className="m-0 font-display text-22 leading-x120 font-semibold tracking-n020">{title}</h2>
      {children && <p className="m-0 max-w-90 text-15 leading-x145 text-fg-2">{children}</p>}
      {action && <div className="mt-2 flex w-full max-w-90 flex-col">{action}</div>}
    </div>
  )
}
