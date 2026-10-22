import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Page padding from the app screens (README "Spacing"): phone 20 px sides with the top cleared
// for the floating bar; tablet 32; desktop 48 and wider top/bottom.
const pageVariants = cva(
  "mx-auto box-border flex w-full flex-col gap-6 px-5 pt-[calc(var(--safe-top)+82px)] tablet:px-8 tablet:pt-8 desktop:px-12 desktop:pt-10",
  {
    variants: {
      /** Bottom clearance: the tab bar (140), the tab bar plus a docked CTA (200), or none. */
      bottom: {
        tabbar: "pb-35 tablet:pb-14 desktop:pb-16",
        dock: "pb-50 tablet:pb-14 desktop:pb-16",
        flush: "pb-0 tablet:pb-0",
      },
    },
    defaultVariants: { bottom: "tabbar" },
  },
)

type PageContainerProps = ComponentProps<"div"> & VariantProps<typeof pageVariants>

/** Centered page column. Pass a `max-w-*` class for the page's content width. */
export function PageContainer({ bottom, className, ...props }: PageContainerProps) {
  return <div className={cn(pageVariants({ bottom }), className)} {...props} />
}
