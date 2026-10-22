"use client"

import { useBreakpoint } from "@/hooks/use-breakpoint"

import { LiveDesktop } from "./live-desktop"
import { LivePhone } from "./live-phone"
import { useLiveBoard } from "./use-live-board"

/** The Live Board: one state, two layouts (phone and tablet stack; desktop is three panes). */
export function LiveBoard() {
  const board = useLiveBoard()
  const breakpoint = useBreakpoint()
  return breakpoint === "desktop" ? <LiveDesktop board={board} /> : <LivePhone board={board} />
}
