"use client"

import { useRouter } from "next/navigation"

import { Icon, ListRow, ListRowAction } from "@/components/shared"
import { TONIGHT } from "@/mocks/staff"

/** Address, contact, dress code and details rows under tonight's hero. */
export function ShiftInfoRows() {
  const router = useRouter()
  return (
    <div className="flex flex-col border-t border-line">
      <ListRow
        render={<a href={TONIGHT.mapsUrl} target="_blank" rel="noopener noreferrer" />}
        leading={<Icon name="location_on" filled size={24} className="text-fg-2" />}
        trailing={
          <>
            <ListRowAction>Directions</ListRowAction>
            <Icon name="open_in_new" size={22} />
          </>
        }
        className="animate-rise [animation-delay:80ms]"
      >
        {TONIGHT.address}
      </ListRow>
      <ListRow
        leading={<Icon name="person" filled size={24} className="text-fg-2" />}
        trailing={
          <a
            href={`tel:${TONIGHT.contact.tel}`}
            aria-label={`Call ${TONIGHT.contact.name}`}
            className="grid size-11 place-items-center rounded-pill bg-surface text-fg"
          >
            <Icon name="call" filled size={22} />
          </a>
        }
        className="animate-rise [animation-delay:140ms]"
      >
        {TONIGHT.contact.text}
      </ListRow>
      <ListRow
        leading={<Icon name="checkroom" filled size={24} className="text-fg-2" />}
        className="animate-rise [animation-delay:200ms]"
      >
        {TONIGHT.dress}
      </ListRow>
      <ListRow
        render={<button type="button" onClick={() => router.push("/staff/shifts/detail")} />}
        leading={<Icon name="description" filled size={24} className="text-fg-2" />}
        trailing={<Icon name="chevron_right" size={24} />}
        className="animate-rise [animation-delay:260ms]"
      >
        Shift details &amp; instructions
      </ListRow>
    </div>
  )
}
