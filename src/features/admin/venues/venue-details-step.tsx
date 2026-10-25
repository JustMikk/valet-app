"use client"

import { FIELD_CONTROL, FormField } from "../common/form-field"
import type { VenueDraft } from "./venue-draft"

type DetailsStepProps = {
  draft: VenueDraft
  onChange: (next: VenueDraft) => void
}

/** Step 2: the venue's name and address, who staff ask for, dress code and what it is billed. */
export function VenueDetailsStep({ draft, onChange }: DetailsStepProps) {
  const set = (patch: Partial<VenueDraft>) => onChange({ ...draft, ...patch })
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Venue name" icon="location_on" htmlFor="v-name">
        <input
          id="v-name"
          required
          maxLength={80}
          value={draft.name}
          placeholder="The Grand Hotel"
          onChange={(e) => set({ name: e.target.value })}
          className={FIELD_CONTROL}
        />
      </FormField>
      <FormField label="Street address" icon="home" htmlFor="v-street">
        <input
          id="v-street"
          required
          maxLength={160}
          value={draft.street}
          placeholder="400 Market St, San Francisco"
          onChange={(e) => set({ street: e.target.value })}
          className={FIELD_CONTROL}
        />
      </FormField>
      <div className="flex gap-2.5">
        <FormField label="Venue contact" icon="person" htmlFor="v-contact">
          <input
            id="v-contact"
            maxLength={80}
            value={draft.contactName}
            placeholder="Priya, front desk"
            onChange={(e) => set({ contactName: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Contact phone" icon="call" htmlFor="v-tel">
          <input
            id="v-tel"
            type="tel"
            maxLength={40}
            value={draft.contactTel}
            placeholder="(415) 555-0100"
            onChange={(e) => set({ contactTel: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>
      <FormField label="Default dress code" icon="checkroom" htmlFor="v-dress">
        <input
          id="v-dress"
          maxLength={120}
          value={draft.dress}
          placeholder="Black suit"
          onChange={(e) => set({ dress: e.target.value })}
          className={FIELD_CONTROL}
        />
      </FormField>
      <div className="flex gap-2.5">
        <FormField label="Bill rate ($ / h)" icon="request_quote" htmlFor="v-rate">
          <input
            id="v-rate"
            required
            inputMode="decimal"
            value={draft.rate}
            placeholder="38.00"
            onChange={(e) => set({ rate: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Billing email" icon="receipt_long" htmlFor="v-billing">
          <input
            id="v-billing"
            type="email"
            value={draft.billingEmail}
            placeholder="billing@venue.com"
            onChange={(e) => set({ billingEmail: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>
    </div>
  )
}
