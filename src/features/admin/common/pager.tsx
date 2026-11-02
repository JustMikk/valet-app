"use client"

import { useState } from "react"

import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"

/** Rows per page: a list never runs past one screen (client direction). */
export const PAGE_SIZE = 8

/**
 * One page of `items`. The page clamps when the list shrinks (a filter or search), so a
 * narrower list never lands on an empty page.
 */
export function usePager<T>(items: T[], size = PAGE_SIZE) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pages - 1)
  return {
    rows: items.slice(current * size, current * size + size),
    page: current,
    pages,
    from: items.length === 0 ? 0 : current * size + 1,
    to: Math.min(items.length, (current + 1) * size),
    total: items.length,
    prev: () => setPage(Math.max(0, current - 1)),
    next: () => setPage(Math.min(pages - 1, current + 1)),
  }
}

type PagerProps = Pick<
  ReturnType<typeof usePager>,
  "page" | "pages" | "from" | "to" | "total" | "prev" | "next"
> & { className?: string }

const ARROW =
  "grid size-9 place-items-center rounded-pill border border-line bg-elev text-fg transition-[background-color,opacity] duration-160 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-elev"

/** "1–8 of 23" with previous and next arrows. Hidden when everything fits on one page. */
export function Pager({ page, pages, from, to, total, prev, next, className }: PagerProps) {
  if (pages <= 1) return null
  return (
    <nav
      aria-label="Pages"
      className={cn(
        "flex items-center justify-between gap-3 border-t border-line px-4 py-3 tablet:px-5",
        className,
      )}
    >
      <span className="text-13 font-medium text-fg-2 tabular-nums">
        {from}–{to} of {total}
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={prev}
          className={ARROW}
        >
          <Icon name="chevron_right" size={20} className="rotate-180" />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages - 1}
          onClick={next}
          className={ARROW}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </span>
    </nav>
  )
}
