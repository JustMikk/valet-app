"use client"

import { useRouter } from "next/navigation"

import { Icon, ListRow, ListRowAction } from "@/components/shared"
import type { HomeShift } from "@/lib/data"

/** Address, contact, dress code and details rows under tonight's hero. */
export function ShiftInfoRows({ shift }: { shift: HomeShift }) {
  const router = useRouter()
  return (
    <div className="flex flex-col border-t border-line">
      <ListRow
        render={<a href={shift.mapsUrl} target="_blank" rel="noopener noreferrer" />}
        leading={<Icon name="location_on" filled size={24} className="text-fg-2" />}
        trailing={
          <>
            <ListRowAction>Directions</ListRowAction>
            <Icon name="open_in_new" size={22} />
          </>
        }
        className="animate-rise [animation-delay:80ms]"
      >
        {shift.address}
      </ListRow>
      <ListRow
        leading={<Icon name="person" filled size={24} className="text-fg-2" />}
        trailing={
          <a
            href={`tel:${shift.contact.tel}`}
            aria-label={`Call ${shift.contact.name}`}
            className="grid size-11 place-items-center rounded-pill bg-surface text-fg"
          >
            <Icon name="call" filled size={22} />
          </a>
        }
        className="animate-rise [animation-delay:140ms]"
      >
        {shift.contact.text}
      </ListRow>
      <ListRow
        leading={<Icon name="checkroom" filled size={24} className="text-fg-2" />}
        className="animate-rise [animation-delay:200ms]"
      >
        {shift.dress}
      </ListRow>
      <ListRow
        render={
          <button
            type="button"
            onClick={() => router.push(`/staff/shifts/detail?id=${shift.assignmentId}`)}
          />
        }
        leading={<Icon name="description" filled size={24} className="text-fg-2" />}
        trailing={<Icon name="chevron_right" size={24} />}
        className="animate-rise [animation-delay:260ms]"
      >
        Shift details &amp; instructions
      </ListRow>
    </div>
  )
}
