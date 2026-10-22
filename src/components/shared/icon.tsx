import { cn } from "@/lib/utils"

import type { IconName } from "./icon-names"

// Sizes the design export uses for glyphs.
export type IconSize = 16 | 18 | 20 | 22 | 24 | 25 | 26 | 28 | 32
export type IconWeight = 400 | 500 | 600 | 700

type IconProps = {
  name: IconName
  /** FILL axis: filled glyph (most of the design) or outline. */
  filled?: boolean
  weight?: IconWeight
  size?: IconSize
  /** Accessible name. Without it the glyph is decorative and hidden from assistive tech. */
  label?: string
  className?: string
}

/** Material Symbols Rounded glyph from the self-hosted subset font (ADR-007). */
export function Icon({
  name,
  filled = false,
  weight = 400,
  size = 24,
  label,
  className,
}: IconProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 font-icon [font-feature-settings:'liga'] leading-x100 tracking-normal whitespace-nowrap normal-case select-none",
        className,
      )}
      // Size and variation axes are per-instance values, not theme tokens.
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}`,
      }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {name}
    </span>
  )
}
