import { useId, type ComponentProps, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { IconName } from "@/lib/icons/icon-names"

import { Icon } from "./icon"

type ActionButtonProps = ComponentProps<typeof Button> & {
  /** Leading glyph (filled, as in the design). */
  icon?: IconName
  /** Trailing glyph, e.g. chevron_right on ghost links. */
  iconEnd?: IconName
  /** Diagonal sweep on the one primary CTA of a view. Dropped under reduced motion. */
  shine?: boolean
  /** Why the action is unavailable; shown under the button and linked as its description. */
  reason?: ReactNode
}

/** Button with the design's icon slots, CTA shine and disabled reason line. */
export function ActionButton({
  icon,
  iconEnd,
  shine = false,
  reason,
  children,
  ...props
}: ActionButtonProps) {
  const reasonId = useId()
  const button = (
    <Button aria-describedby={reason ? reasonId : undefined} {...props}>
      {icon && <Icon name={icon} filled size={22} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={22} />}
      {shine && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-shine shine-sweep"
        />
      )}
    </Button>
  )
  if (!reason) return button
  return (
    <>
      {button}
      <p id={reasonId} className="text-13 leading-x140 text-fg-2">
        {reason}
      </p>
    </>
  )
}
