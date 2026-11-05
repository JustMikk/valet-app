"use client"

import { useState, type ReactNode } from "react"

import { Icon, PillTabs } from "@/components/shared"
import { cn } from "@/lib/utils"
import type { StaffBucket, StaffList as StaffListData, StaffTab } from "@/lib/data"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, PersonCell, StatusCell, TABLE_CARD } from "../common/data-table"
import { Pager, usePager } from "../common/pager"
import { QueryState } from "../data/query-state"
import { useStaff } from "../data/queries"
import { SummaryBar } from "../common/summary-bar"
import { InviteSheet } from "./invite-sheet"

function inTab(tab: StaffTab, bucket: StaffBucket): boolean {
  if (tab === "all") return true
  if (tab === "active") return bucket !== "invited" && bucket !== "inactive"
  return bucket === tab
}

/** Staff directory: search, status tabs and a table that collapses to two columns on phone. */
export function StaffList() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tab, setTab] = useState<StaffTab>("all")
  const [query, setQuery] = useState("")
  const staff = useStaff()
  const data = staff.data
  const tabs = [
    { value: "all" as const, label: "All" },
    { value: "active" as const, label: "Active" },
    { value: "invited" as const, label: "Invited", count: data?.invited || undefined },
    { value: "alerts" as const, label: "Alerts off", count: data?.alertsOff || undefined },
  ]
  // Search: in the top bar left of the tabs from tablet (like the Live Board's), over the list on phone.
  const searchFor = (wide: boolean) => (
    <label
      className={cn(
        "flex items-center gap-2 rounded-pill bg-surface text-fg-2",
        wide ? "h-11 w-60 px-4 text-15" : "h-13 px-4.5 text-16 tablet:hidden",
      )}
    >
      <Icon name="search" size={wide ? 20 : 22} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={data ? `Search ${data.total} staff` : "Search staff"}
        aria-label="Search staff"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-fg outline-none placeholder:text-fg-3"
      />
    </label>
  )
  const tabsFor = (className?: string) => (
    <PillTabs label="Show" items={tabs} value={tab} onValueChange={setTab} className={className} />
  )

  return (
    <AdminPage>
      <AdminHead
        title="Staff"
        sub={
          data
            ? `${data.total} ${data.total === 1 ? "person" : "people"}${data.invited ? ` · ${data.invited} invite${data.invited === 1 ? "" : "s"} pending` : ""}`
            : "…"
        }
        cta={{ label: "Invite", icon: "person_add", onClick: () => setInviteOpen(true) }}
        tools={
          <>
            {searchFor(true)}
            {tabsFor()}
          </>
        }
      />
      <QueryState query={staff} rows={6}>
        {/* Phone: the filters sit under the heading; from tablet they live in the top bar. */}
        {(list) => (
          <Directory
            list={list}
            tab={tab}
            query={query}
            tabs={tabsFor("tablet:hidden")}
            search={searchFor(false)}
          />
        )}
      </QueryState>
      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </AdminPage>
  )
}

function Directory({
  list,
  tab,
  query,
  tabs,
  search,
}: {
  list: StaffListData
  tab: StaffTab
  query: string
  tabs: ReactNode
  search: ReactNode
}) {
  const q = query.trim().toLowerCase()
  const rows = list.rows.filter(
    (row) =>
      inTab(tab, row.bucket) &&
      (!q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)),
  )
  const pager = usePager(rows)

  return (
    <>
      {tabs}
      <div className="flex flex-col gap-3.5">
        {search}
        {tab === "invited" && rows.length > 0 && (
          <SummaryBar icon="person_add" tone="info">
            {rows.length} {rows.length === 1 ? "invite is" : "invites are"} pending. People show as
            active once they open the link and sign in.
          </SummaryBar>
        )}
        {tab === "alerts" && rows.length > 0 && (
          <SummaryBar icon="notifications" tone="warn">
            {rows.length} {rows.length === 1 ? "person has" : "people have"} alerts off and
            won&apos;t get shift or late pushes. Message them to turn alerts back on.
          </SummaryBar>
        )}
        <div className={TABLE_CARD}>
          <DataHead columns={["Name", "Status", "Next shift", "This week"]} />
          <div className="flex flex-col">
            {pager.rows.map((row) => (
              <DataRow key={row.id} href={`/admin/staff/person?id=${row.id}`}>
                <PersonCell name={row.name} sub={row.email} />
                <StatusCell status={row.status} />
                <span className="hidden text-15 text-fg-2 tablet:block">{row.next}</span>
                <span className="hidden text-right font-mono text-15 font-semibold tablet:block">
                  {row.hours}
                </span>
              </DataRow>
            ))}
            {rows.length === 0 && (
              <p className="m-0 py-8 text-center text-15 text-fg-2">No one matches that.</p>
            )}
          </div>
          <Pager {...pager} />
        </div>
      </div>
    </>
  )
}
