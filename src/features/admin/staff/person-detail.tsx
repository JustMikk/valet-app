"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { ConfirmSheet, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { Person } from "@/lib/data"

import { AdminPage, SectionTitle, SPLIT } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useDeactivate, usePerson } from "../data/queries"

const CONTACT = "h-13 flex-1 gap-2 text-16"

/** One staff member: contact actions, profile facts and recent shifts. `?id=` picks the person. */
export function PersonDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const person = usePerson(id)
  return (
    <AdminPage>
      <QueryState query={person} rows={4}>
        {(data) => <PersonBody person={data} />}
      </QueryState>
    </AdminPage>
  )
}

function PersonBody({ person }: { person: Person }) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deactivate = useDeactivate()
  const first = person.name.split(" ")[0]

  return (
    <>
      <div className={SPLIT}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-20 flex-none place-items-center rounded-pill bg-surface-2 font-display text-28 font-bold"
            >
              {person.initials}
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="m-0 font-display text-34 leading-x105 font-bold tracking-n030">
                {person.name}
              </h1>
              <span className="text-15 text-fg-2">{person.role}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              className={CONTACT}
              nativeButton={false}
              render={<a href={`tel:${person.phone}`} />}
            >
              <Icon name="call" filled size={22} />
              Call
            </Button>
            <Button
              variant="secondary"
              className={CONTACT}
              nativeButton={false}
              render={<Link href={`/admin/inbox?thread=${person.id}`} />}
            >
              <Icon name="chat_bubble" filled size={22} />
              Message
            </Button>
          </div>
          <dl className="m-0 flex flex-col border-t border-line">
            {person.rows.map((row) => (
              <div
                key={row.k}
                className="box-content flex min-h-14.5 items-center gap-3 border-b border-line"
              >
                <dt className="flex-1 text-16">{row.k}</dt>
                <dd className="m-0 text-15 font-medium text-fg-2">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-2.5">
          <SectionTitle>Recent shifts</SectionTitle>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {person.shifts.map((shift, i) => (
              <li
                key={`${shift.when}-${i}`}
                className="box-content flex min-h-16 items-center gap-3 border-b border-line"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-16 font-semibold">{shift.venue}</span>
                  <span className="text-14 text-fg-2">{shift.when}</span>
                </div>
                <span className="font-mono text-15 font-semibold">{shift.hours}</span>
              </li>
            ))}
            {person.shifts.length === 0 && (
              <li className="py-6 text-15 text-fg-2">No shifts yet.</li>
            )}
          </ul>
          {deactivate.error && <ErrorNotice message={deactivate.error.message} />}
          {person.active && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-13 text-16 text-bad shadow-[inset_0_0_0_1.5px_var(--line)]"
              onClick={() => setConfirmOpen(true)}
            >
              Deactivate
            </Button>
          )}
        </div>
      </div>
      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Deactivate ${person.name}?`}
        consequence={`${first} is removed from upcoming shifts and can no longer clock in. Past hours stay on record.`}
        confirmLabel="Deactivate"
        tone="destructive"
        onConfirm={() =>
          deactivate.mutate(person.id, { onSuccess: () => router.push("/admin/staff") })
        }
      />
    </>
  )
}
