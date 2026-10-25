"use client"

import { useEffect } from "react"

import { NotificationList, PageContainer, PageTitle } from "@/components/shared"

import { QueryState } from "../data/query-state"
import { useMarkNotificationsRead, useNotifications } from "../data/queries"

/** The notification center as a page (the bell opens it as a drawer; this keeps deep links working). */
export function Notifications() {
  const notifications = useNotifications()
  const { mutate: markRead } = useMarkNotificationsRead()
  const unread = notifications.data?.unread ?? 0

  // Opening the center reads everything (the bell dot clears).
  useEffect(() => {
    if (unread > 0) markRead()
  }, [unread, markRead])

  return (
    <PageContainer className="max-w-180 tablet:pb-12 desktop:pb-12">
      <div className="flex flex-col gap-3">
        <PageTitle>Notifications</PageTitle>
        <QueryState query={notifications} rows={4}>
          {({ groups }) => <NotificationList groups={groups} />}
        </QueryState>
      </div>
    </PageContainer>
  )
}
