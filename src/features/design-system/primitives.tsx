import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Numbered section heading of the sheet: "01 — PRINCIPLES". */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="m-0 font-mono text-13 leading-x100 font-semibold tracking-p060 text-fg-2">
      {children}
    </h2>
  )
}

/** White panel on the canvas. Radius and padding vary per section, as on the sheet. */
export function SheetPanel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col bg-bg", className)} {...props} />
}

/** Inline token name set in mono inside running text. */
export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>
}
