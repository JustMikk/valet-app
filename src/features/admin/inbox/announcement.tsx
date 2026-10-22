"use client"

import { useState } from "react"

import { Icon, PillTabs, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AUDIENCES, BROADCAST_DEFAULT, type AudienceKey } from "@/mocks/admin"

import { AdminHead, AdminPage, FORM } from "../common/admin-page"

const AUDIENCE_ITEMS = AUDIENCES.map((a) => ({ value: a.key, label: a.label }))

/** Announcement composer: choose the audience, write, and see who it will reach before sending. */
export function Announcement() {
  const [audience, setAudience] = useState<AudienceKey>("event")
  const [sent, setSent] = useState(false)
  const reach = AUDIENCES.find((a) => a.key === audience)?.reach

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
          setSent(true)
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-15 font-medium">Send to</span>
          <PillTabs
            label="Send to"
            items={AUDIENCE_ITEMS}
            value={audience}
            onValueChange={setAudience}
            className="flex-wrap overflow-visible"
          />
        </div>
        <TextField label="Message" multiline rows={5} defaultValue={BROADCAST_DEFAULT} />
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-r18 bg-surface px-4 py-3.5 text-14 leading-x140 font-medium text-fg-2"
        >
          <Icon name="notifications_active" size={20} />
          {reach}
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={sent}
          className={cn(
            "text-17 transition-colors duration-300",
            sent && "bg-ok text-white disabled:bg-ok disabled:text-white",
          )}
        >
          {sent ? "Sent · 6 delivered" : "Send announcement"}
        </Button>
      </form>
    </AdminPage>
  )
}
