"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ConfirmSheet, Icon } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { PERSON } from "@/mocks/admin"

import { AdminPage, SectionTitle, SPLIT } from "../common/admin-page"

const CONTACT = "h-13 flex-1 gap-2 text-16"

/** One staff member: contact actions, profile facts and recent shifts. */
export function PersonDetail() {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <AdminPage>
      <div className={SPLIT}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-20 flex-none place-items-center rounded-pill bg-surface-2 font-display text-28 font-bold"
            >
              {PERSON.initials}
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="m-0 font-display text-34 leading-x105 font-bold tracking-n030">
                {PERSON.name}
              </h1>
              <span className="text-15 text-fg-2">{PERSON.role}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              className={CONTACT}
              nativeButton={false}
              render={<a href={`tel:${PERSON.phone}`} />}
            >
              <Icon name="call" filled size={22} />
              Call
            </Button>
            <Button
              variant="secondary"
              className={CONTACT}
              nativeButton={false}
              render={<Link href="/admin/inbox" />}
            >
              <Icon name="chat_bubble" filled size={22} />
              Message
            </Button>
          </div>
          <dl className="m-0 flex flex-col border-t border-line">
            {PERSON.rows.map((row) => (
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
            {PERSON.shifts.map((shift) => (
              <li
                key={shift.when}
                className="box-content flex min-h-16 items-center gap-3 border-b border-line"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-16 font-semibold">{shift.venue}</span>
                  <span className="text-14 text-fg-2">{shift.when}</span>
                </div>
                <span className="font-mono text-15 font-semibold">{shift.hours}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-13 text-16 text-bad shadow-[inset_0_0_0_1.5px_var(--line)]"
            onClick={() => setConfirmOpen(true)}
          >
            Deactivate
          </Button>
        </div>
      </div>
      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deactivate Jordan Ellis?"
        consequence="Jordan is removed from upcoming shifts and can no longer clock in. Past hours stay on record."
        confirmLabel="Deactivate"
        tone="destructive"
        onConfirm={() => router.push("/admin/staff")}
      />
    </AdminPage>
  )
}
