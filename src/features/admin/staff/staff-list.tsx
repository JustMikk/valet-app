"use client"

import { useState } from "react"

import { Icon, PillTabs } from "@/components/shared"
import { STAFF_ROWS, STAFF_TABS, type StaffTab } from "@/mocks/admin"

import { AdminHead, AdminPage } from "../common/admin-page"
import { DataHead, DataRow, PersonCell, StatusCell } from "../common/data-table"
import { InviteSheet } from "./invite-sheet"

function inTab(tab: StaffTab, bucket: (typeof STAFF_ROWS)[number]["bucket"]): boolean {
  if (tab === "all") return true
  if (tab === "active") return bucket !== "invited" && bucket !== "inactive"
  return bucket === tab
}

/** Staff directory: search, status tabs and a table that collapses to two columns on phone. */
export function StaffList() {
  const [tab, setTab] = useState<StaffTab>("all")
  const [query, setQuery] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)

  const q = query.trim().toLowerCase()
  const rows = STAFF_ROWS.filter(
    (row) =>
      inTab(tab, row.bucket) &&
      (!q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)),
  )

  return (
    <AdminPage>
      <AdminHead
        title="Staff"
        sub="42 people · 1 invite pending"
        cta={{ label: "Invite", icon: "person_add", onClick: () => setInviteOpen(true) }}
      />
      <PillTabs label="Show" items={STAFF_TABS} value={tab} onValueChange={setTab} />
      <div className="flex flex-col gap-3.5">
        <label className="flex h-13 max-w-130 items-center gap-2.5 rounded-pill bg-surface px-4.5">
          <Icon name="search" size={22} className="text-fg-2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 42 staff"
            aria-label="Search staff"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-16 text-fg outline-none placeholder:text-fg-3"
          />
        </label>
        <DataHead columns={["Name", "Status", "Next shift", "This week"]} />
        <div className="flex flex-col border-t border-line">
          {rows.map((row) => (
            <DataRow key={row.email} href="/admin/staff/person">
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
      </div>
      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </AdminPage>
  )
}
