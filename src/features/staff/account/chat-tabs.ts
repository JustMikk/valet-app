import type { ChatItem } from "@/lib/data"

export type InboxTab = "chat" | "announcements"

/**
 * The thread for one tab: direct messages with dispatch, or the announcements sent to everyone.
 * Day dividers stay only above a day that has something to show in that tab.
 */
export function forTab(items: ChatItem[], tab: InboxTab): ChatItem[] {
  const wanted = (item: ChatItem) =>
    item.kind === "message" && (item.from === "broadcast") === (tab === "announcements")
  const out: ChatItem[] = []
  let divider: ChatItem | null = null
  for (const item of items) {
    if (item.kind === "day") divider = item
    else if (wanted(item)) {
      if (divider) out.push(divider)
      divider = null
      out.push(item)
    }
  }
  return out
}
