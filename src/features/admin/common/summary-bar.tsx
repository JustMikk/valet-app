import type { ReactNode } from "react"
import Link from "next/link"

import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

const TONE = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-fg-2",
} as const

type SummaryAction =
  { label: string; onClick: () => void; disabled?: boolean } | { label: string; href: string }

type SummaryBarProps = {
  icon: IconName
  tone: keyof typeof TONE
  /** One line: what this list adds up to. */
  children: ReactNode
  /** The one thing to do about it, when the app has that action. */
  action?: SummaryAction
  className?: string
}

/**
 * The bar at the top of a list (Hours' "18 entries have no flags · Approve 18"): one line on
 * what the list adds up to, and its main action on the right.
 */
export function SummaryBar({ icon, tone, children, action, className }: SummaryBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-r20 border border-line bg-elev px-4.5 py-3.5",
        className,
      )}
    >
      <Icon name={icon} filled size={24} className={TONE[tone]} />
      <span className="min-w-50 flex-1 text-15 leading-x140 font-medium">{children}</span>
      {action &&
        ("href" in action ? (
          <Button
            variant="strong"
            size="compact"
            className="px-4.5"
            nativeButton={false}
            render={<Link href={action.href} />}
          >
            {action.label}
          </Button>
        ) : (
          <Button
            variant="strong"
            size="compact"
            className="px-4.5"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
    </div>
  )
}
