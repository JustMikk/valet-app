"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { PillTabs } from "@/components/shared"

import { AdminPage } from "../common/admin-page"
import { QueryState } from "../data/query-state"
import { useEvent } from "../data/queries"
import { EventOverview } from "./event-detail"
import { PaySheet } from "./pay-sheet"

const TABS = [
  { value: "overview" as const, label: "Overview" },
  { value: "pay" as const, label: "Pay" },
]

/** One event (`?id=`): its Overview, and the valets' pay sheet on the Pay tab (`&tab=pay`). */
export function EventDetail() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get("id") ?? undefined
  const tab = params.get("tab") === "pay" ? "pay" : "overview"
  const event = useEvent(id)
  return (
    <AdminPage>
      <QueryState query={event} rows={4}>
        {(data) => (
          <div className="flex flex-col gap-5">
            <PillTabs
              label="Event"
              items={TABS}
              value={tab}
              onValueChange={(next) =>
                router.replace(
                  `/admin/events/detail?id=${data.id}${next === "pay" ? "&tab=pay" : ""}`,
                )
              }
              className="self-start"
            />
            {tab === "pay" ? <PaySheet eventId={data.id} /> : <EventOverview event={data} />}
          </div>
        )}
      </QueryState>
    </AdminPage>
  )
}
