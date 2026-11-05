import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Vendor edit (ADR-006, DESIGN_INTAKE): shadcn's variants and sizes replaced with the design
// export's button system. Pill radius everywhere; heights and label sizes as the app screens use.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill border-0 font-sans font-semibold whitespace-nowrap transition-transform duration-160 select-none active:scale-97 disabled:cursor-not-allowed disabled:bg-surface disabled:text-fg-3 disabled:shadow-none disabled:active:scale-100",
  {
    variants: {
      variant: {
        // Regency (client choice, ADR-020): the light accent with a white label.
        // Below 4.5:1 by design; the bold label and icon carry it.
        accent: "bg-accent text-white",
        strong: "bg-fg text-bg",
        secondary: "bg-surface text-fg",
        elevated: "bg-elev text-fg",
        ghost: "bg-transparent text-fg",
        glass: "glass text-fg",
        destructive: "bg-bad text-bg",
        "destructive-soft": "bg-bad-soft text-bad",
      },
      size: {
        cta: "h-15 gap-2 px-6 text-19",
        xl: "h-14.5 gap-2 px-6 text-18",
        lg: "h-14 gap-2 px-6 text-17",
        md: "h-13 gap-1.5 px-5 text-16",
        sm: "h-12 gap-1 px-4 text-16",
        compact: "h-11 gap-1 px-4 text-15",
        xs: "h-10 gap-1 px-4 text-14",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "lg",
    },
  },
)

function Button({
  className,
  variant = "secondary",
  size = "lg",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
