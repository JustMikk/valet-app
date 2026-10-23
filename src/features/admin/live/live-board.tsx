"use client"

import { useBreakpoint } from "@/hooks/use-breakpoint"

import { PageContainer } from "@/components/shared"

import { QueryState } from "../data/query-state"
import { LiveDesktop } from "./live-desktop"
import { LivePhone } from "./live-phone"
import { useLiveBoard } from "./use-live-board"

/** The Live Board: one state, two layouts (phone and tablet stack; desktop is three panes). */
export function LiveBoard() {
  const board = useLiveBoard()
  const breakpoint = useBreakpoint()
  return (
    <QueryState
      query={board.query}
      rows={5}
      // Until the first board arrives there is nothing to lay out: a quiet placeholder page.
      fallback={(content) => <PageContainer className="max-w-290">{content}</PageContainer>}
    >
      {() =>
        breakpoint === "desktop" ? <LiveDesktop board={board} /> : <LivePhone board={board} />
      }
    </QueryState>
  )
}
