import { describe, expect, it } from "vitest"

import type { ChatItem } from "@/lib/data"

import { forTab } from "./chat-tabs"

const day = (id: string): ChatItem => ({ kind: "day", id, text: id })
const msg = (id: string, from: "them" | "me" | "broadcast"): ChatItem => ({
  kind: "message",
  id,
  from,
  text: id,
  meta: "",
})

const items = [
  day("d1"),
  msg("a", "them"),
  msg("b", "broadcast"),
  day("d2"),
  msg("c", "broadcast"),
  day("d3"),
  msg("d", "me"),
]
const ids = (list: ChatItem[]) => list.map((i) => i.id)

describe("forTab", () => {
  it("keeps direct messages (theirs and mine) in the chat tab", () => {
    expect(ids(forTab(items, "chat"))).toEqual(["d1", "a", "d3", "d"])
  })

  it("keeps only announcements in the announcements tab", () => {
    expect(ids(forTab(items, "announcements"))).toEqual(["d1", "b", "d2", "c"])
  })

  it("drops a day divider with nothing under it", () => {
    expect(forTab([day("d1")], "chat")).toEqual([])
  })
})
