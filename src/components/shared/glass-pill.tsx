import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Floating glass pill of the top bar: logo or menu glyph plus a title (Staff PWA / Admin shells). */
export function GlassPill({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex h-14 items-center gap-2.5 rounded-pill glass pr-5 pl-3.5 text-18 font-semibold tracking-n010 text-fg",
        className,
      )}
      {...props}
    />
  )
}
