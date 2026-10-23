"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * The app's scrolling content pane. Each route enters with the design's screen transition
 * (a plain .22 s fade: scaling a page full of blurred glass janks, see OPEN_QUESTIONS D19), and a new route starts at the top
 * instead of inheriting the previous page's scroll position.
 */
export function RouteScreen({ back, children }: { back: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  const pane = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pane.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div ref={pane} className="no-scrollbar flex h-full flex-col overflow-y-auto">
      {back}
      {/* Keyed so each route remounts and replays the transition; the Back row stays put. */}
      <div key={pathname} className="min-h-0 flex-1 animate-route">
        {children}
      </div>
    </div>
  )
}
