"use client"

import { NotificationList, PushPrompt, useShellMenu } from "@/components/shared"
import { usePush } from "@/hooks/use-push"

import { QueryState } from "../data/query-state"
import { useNotifications } from "../data/queries"

/** The drawer's content for dispatch: what needs attention, and alerts on this device. */
export function NotificationPanel() {
  const { setNotificationsOpen } = useShellMenu()
  const notifications = useNotifications()
  const push = usePush("admin")

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <QueryState query={notifications} rows={4}>
          {({ groups }) => (
            <NotificationList groups={groups} onOpen={() => setNotificationsOpen(false)} />
          )}
        </QueryState>
      </div>
      <PushPrompt
        status={push.status}
        busy={push.enable.isPending || push.disable.isPending}
        error={push.enable.error?.message ?? push.disable.error?.message}
        onEnable={() => push.enable.mutate()}
        onDisable={() => push.disable.mutate()}
      />
    </>
  )
}
