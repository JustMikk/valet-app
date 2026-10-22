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
  // The full-width CTA carries a 24 px glyph (Staff Home); every other size 22 px.
  const glyph = props.size === "cta" ? 24 : 22
  const button = (
    <Button aria-describedby={reason ? reasonId : undefined} {...props}>
      {icon && <Icon name={icon} filled size={glyph} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={glyph} />}
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
      <p id={reasonId} className="text-center text-14 text-fg-2">
        {reason}
      </p>
    </>
  )
}
