"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

import { Icon, PillTabs, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { AudienceKey } from "@/lib/data"
import { cn } from "@/lib/utils"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"
import { ErrorNotice } from "../data/query-state"
import { useAnnounce, useAudiences } from "../data/queries"

/** Announcement composer: choose the audience, write, and see who it will reach before sending. */
export function Announcement() {
  const eventId = useSearchParams().get("event") ?? undefined
  const audiences = useAudiences(eventId)
  const announce = useAnnounce()
  const [picked, setPicked] = useState<AudienceKey | undefined>(undefined)
  const [text, setText] = useState("")

  const items = audiences.data ?? []
  const audience = picked ?? (eventId ? "event" : (items[0]?.key ?? "tonight"))
  const reach = items.find((a) => a.key === audience)?.reach
  const sent = announce.data

  return (
    <AdminPage>
      <AdminHead
        title="Announcement"
        sub="Sent as a push notification and in each person’s inbox"
      />
      <form
        className={FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) announce.mutate({ audience, eventId, text: text.trim() })
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-15 font-medium">Send to</span>
          <PillTabs
            label="Send to"
            items={items.map((a) => ({ value: a.key, label: a.label }))}
            value={audience}
            onValueChange={setPicked}
            className="flex-wrap overflow-visible"
          />
        </div>
        <TextField
          label="Message"
          multiline
          rows={5}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do they need to know?"
        />
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-r18 bg-surface px-4 py-3.5 text-14 leading-x140 font-medium text-fg-2"
        >
          <Icon name="notifications_active" size={20} />
          {reach ?? "…"}
        </div>
        {announce.error && <ErrorNotice message={announce.error.message} />}
        <Button
          type="submit"
          variant="accent"
          disabled={Boolean(sent) || !text.trim() || announce.isPending}
          className={cn(
            "text-17 transition-colors duration-300",
            sent && "bg-ok text-white disabled:bg-ok disabled:text-white",
          )}
        >
          {sent ? `Sent · ${sent.delivered} delivered` : "Send announcement"}
        </Button>
      </form>
    </AdminPage>
  )
}
