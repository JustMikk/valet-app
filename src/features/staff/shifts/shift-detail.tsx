"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  ActionButton,
  Countdown,
  Icon,
  ListRow,
  ListRowAction,
  PageContainer,
  StatusBadge,
} from "@/components/shared"
import type { ShiftDetail as ShiftDetailData } from "@/lib/data"

import { QueryState } from "../data/query-state"
import { useShift } from "../data/queries"

/** Shift detail: time, venue rows, instructions, message and drop actions. `?id=` picks the shift. */
export function ShiftDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const shift = useShift(id)
  return (
    <PageContainer className="max-w-280">
      <QueryState query={shift} rows={4}>
        {(data) => <DetailBody shift={data} />}
      </QueryState>
    </PageContainer>
  )
}

function DetailBody({ shift: D }: { shift: ShiftDetailData }) {
  const router = useRouter()
  return (
    <div className="grid items-start gap-7 desktop:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <StatusBadge className="self-start" status={D.status} />
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-52 leading-x100 font-bold tracking-n045">
            {D.start}
          </span>
          <span className="font-display text-26 leading-x115 font-semibold tracking-n020">
            {D.title}
          </span>
          <span className="text-16 text-fg-2">{D.when}</span>
          <Countdown startsAt={D.startsAt} endsAt={D.endsAt} className="mt-1 text-16" />
        </div>
        {D.clockNotice && (
          <div className="flex items-center gap-2.5 rounded-r18 bg-surface px-4 py-3.5 text-15 leading-x135 font-medium">
            <Icon name="lock_clock" size={22} className="text-fg-2" />
            {D.clockNotice}
          </div>
        )}
        <div className="flex flex-col border-t border-line">
          <ListRow
            render={<a href={D.mapsUrl} target="_blank" rel="noopener noreferrer" />}
            leading={<Icon name="location_on" filled size={24} className="text-fg-2" />}
            trailing={
              <>
                <ListRowAction>Directions</ListRowAction>
                <Icon name="open_in_new" size={22} />
              </>
            }
          >
            {D.address}
          </ListRow>
          <ListRow
            leading={<Icon name="person" filled size={24} className="text-fg-2" />}
            trailing={
              <a
                href={`tel:${D.report.tel}`}
                aria-label={`Call ${D.report.name}`}
                className="grid size-11 place-items-center rounded-pill bg-surface text-fg"
              >
                <Icon name="call" filled size={22} />
              </a>
            }
          >
            {D.report.text}
          </ListRow>
          <ListRow leading={<Icon name="group" filled size={24} className="text-fg-2" />}>
            {D.crew}
          </ListRow>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {D.instructions && (
          <div className="flex flex-col gap-2.5 rounded-r24 glass-card p-5">
            <span className="font-display text-20 font-semibold tracking-n015">Instructions</span>
            <span className="text-16 leading-x155 text-fg-2">{D.instructions}</span>
          </div>
        )}
        <ActionButton
          variant="secondary"
          icon="chat_bubble"
          onClick={() => router.push("/staff/inbox")}
        >
          Message dispatch
        </ActionButton>
        {D.canDrop && (
          <ActionButton
            variant="ghost"
            className="text-bad shadow-[inset_0_0_0_1.5px_var(--line)]"
            onClick={() => router.push(`/staff/shifts/drop?id=${D.id}`)}
          >
            Can&apos;t make it
          </ActionButton>
        )}
      </div>
    </div>
  )
}
