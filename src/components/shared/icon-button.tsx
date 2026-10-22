import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { Icon } from "./icon"
import type { IconName } from "./icon-names"

const iconButtonVariants = cva(
  "relative inline-grid shrink-0 place-items-center rounded-pill border-0 text-fg transition-transform duration-160 select-none active:scale-94",
  {
    variants: {
      variant: {
        glass: "glass",
        surface: "bg-surface",
      },
      size: {
        lg: "size-14",
        md: "size-13",
        sm: "size-11",
      },
    },
    defaultVariants: { variant: "glass", size: "lg" },
  },
)

const GLYPH = { lg: 24, md: 24, sm: 22 } as const

type IconButtonProps = Omit<ButtonPrimitive.Props, "children"> &
  VariantProps<typeof iconButtonVariants> & {
    icon: IconName
    /** Accessible name; icon-only buttons must have one. */
    label: string
    /** Shows a status dot and appends this text to the accessible name. */
    badge?: string
    filled?: boolean
  }

/** Round icon-only button: glass top-bar control or surface circle. */
export function IconButton({
  icon,
  label,
  badge,
  filled = true,
  variant,
  size,
  className,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      aria-label={badge ? `${label} (${badge})` : label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      <Icon name={icon} filled={filled} size={GLYPH[size ?? "lg"]} />
      {badge && (
        <span
          aria-hidden="true"
          className="absolute top-3.25 right-3.5 size-2.5 rounded-pill bg-bad shadow-[0_0_0_2px_var(--elev)]"
        />
      )}
    </ButtonPrimitive>
  )
}
