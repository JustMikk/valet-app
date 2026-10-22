import * as React from "react"

import { cn } from "@/lib/utils"

// Vendor edit (ADR-006, DESIGN_INTAKE): design textarea (app screens): radius 16, surface fill,
// 14/16 px padding, 17 px / ×1.4, no resize; focus = 1.5 px fg inset (visible focus).
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-none rounded-field border-0 bg-surface px-4 py-3.5 font-sans text-17 leading-x140 text-fg caret-accent outline-none placeholder:text-fg-3 focus:shadow-[inset_0_0_0_1.5px_var(--fg)] disabled:cursor-not-allowed disabled:text-fg-3 aria-invalid:shadow-[inset_0_0_0_1.5px_var(--bad)]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
