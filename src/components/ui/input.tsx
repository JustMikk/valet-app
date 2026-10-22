import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Vendor edit (ADR-006, DESIGN_INTAKE): design input (Design System "field", app screens):
// 56 px, radius 16, surface fill, 17 px, accent caret; focus = 1.5 px fg inset (visible focus).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-field border-0 bg-surface px-4 font-sans text-17 text-fg caret-accent outline-none placeholder:text-fg-3 focus:shadow-[inset_0_0_0_1.5px_var(--fg)] disabled:cursor-not-allowed disabled:text-fg-3 aria-invalid:shadow-[inset_0_0_0_1.5px_var(--bad)]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
