import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Page heading: Prompt 700 / 40 px / -3.5% (README "Page title"). */
export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn("m-0 font-display text-40 leading-x100 font-bold tracking-n035", className)}
      {...props}
    />
  )
}
