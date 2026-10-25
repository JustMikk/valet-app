"use client"

import { useEffect, useRef, ViewTransition, type ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * The app's scrolling content pane. Route changes fade through from the old to the new page with React
 * <ViewTransition> (OPEN_QUESTIONS D19: the exported fade + scale janks on blur-heavy pages), and
 * a new route starts at the top instead of inheriting the previous page's scroll position.
 */
export function RouteScreen({ back, children }: { back: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  const pane = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pane.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div ref={pane} className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
      {back}
      {/* Keyed so each route is a new transition root; the Back row stays put. */}
      <ViewTransition key={pathname} enter="route-in" exit="route-out" default="none">
        <div className="min-h-0 flex-1">{children}</div>
      </ViewTransition>
    </div>
  )
}
