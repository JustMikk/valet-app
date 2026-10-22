"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Vendor edit (ADR-006, DESIGN_INTAKE): shadcn's variants replaced with the design's
// chip-group chip (Design System sheet): 40 px, radius 10, selected = accent-soft + 1.5 px accent
// inset. Base UI marks the pressed state with data-pressed.
const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 items-center justify-center font-sans whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        chip: "rounded-chip font-medium text-fg-3 data-pressed:bg-accent-soft data-pressed:font-semibold data-pressed:text-accent-text data-pressed:shadow-[inset_0_0_0_1.5px_var(--accent)]",
      },
      size: {
        default: "h-10 px-3.5 text-16",
      },
    },
    defaultVariants: {
      variant: "chip",
      size: "default",
    },
  },
)

function Toggle({
  className,
  variant = "chip",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
