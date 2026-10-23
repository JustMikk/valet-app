"use client"

import type { ReactNode } from "react"

import { Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"

/** Placeholder bars while a screen's first data loads; `rows` stand in for list items. */
export function ScreenSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-2/3 rounded-r14" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-card" />
      ))}
    </div>
  )
}

type ErrorNoticeProps = { message: string; onRetry?: () => void }

/** A failed load or action: what happened in words, with a retry where one makes sense. */
export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 rounded-r18 bg-warn-soft px-4 py-3 text-14 leading-x140 font-semibold text-warn"
    >
      <Icon name="wrong_location" filled size={20} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button variant="secondary" size="xs" className="h-9 px-3.5 text-14" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

type QueryStateProps<T> = {
  query: { data: T | undefined; error: Error | null; isPending: boolean; refetch: () => unknown }
  rows?: number
  children: (data: T) => ReactNode
}

/** Renders `children` once data exists; a skeleton while loading; an error with retry otherwise. */
export function QueryState<T>({ query, rows, children }: QueryStateProps<T>) {
  const hydrated = useHydrated()
  if (hydrated && query.data !== undefined) return <>{children(query.data)}</>
  if (hydrated && query.error) {
    return <ErrorNotice message={query.error.message} onRetry={() => void query.refetch()} />
  }
  return <ScreenSkeleton rows={rows} />
}
