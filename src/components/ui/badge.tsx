import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Vendor edit (ADR-006, DESIGN_INTAKE): shadcn's variants replaced with the design's status
// tones (Design System sheet "status-badge") and the two sizes the app screens use.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center overflow-hidden rounded-pill font-sans font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        info: "bg-info-soft text-info",
        bad: "bg-bad-soft text-bad",
        "bad-solid": "bg-bad text-bg",
        strong: "bg-fg text-bg",
        neutral: "bg-surface text-fg",
        muted: "bg-surface text-fg-2",
        /** Confirmed / claimed shifts (Staff Shifts): surface-2 ground. */
        subtle: "bg-surface-2 text-fg-2",
        faint: "bg-surface text-fg-3",
        outline: "text-fg-2 shadow-[inset_0_0_0_1.5px_var(--fg-3-line)]",
      },
      size: {
        md: "h-7.5 gap-1.25 pr-2.75 pl-2 text-14",
        sm: "h-7 gap-1 pr-2.5 pl-1.75 text-13",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  },
)

function Badge({
  className,
  tone = "neutral",
  size = "md",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ tone, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      tone,
    },
  })
}

export { Badge, badgeVariants }
