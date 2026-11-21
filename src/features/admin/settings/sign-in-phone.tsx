"use client"

import { useState } from "react"

import { TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { formatPhone, phoneKey } from "@/lib/contact/contact"

type SignInPhoneProps = {
  phone: string
  saving: boolean
  onSave: (phone: string) => void
}

/** The admin's own phone number, which they can sign in with instead of their email (ADR-025). */
export function SignInPhone({ phone, saving, onSave }: SignInPhoneProps) {
  const [draft, setDraft] = useState(phone)
  const value = draft.trim()
  const valid = value === "" || phoneKey(value) !== null
  const changed = (value === "" ? "" : formatPhone(value)) !== phone

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && changed) onSave(value)
      }}
    >
      <TextField
        label="Your sign-in phone"
        description="Sign in with this number or your email, plus your password. Leave empty to use email only."
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(713) 555-0120"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        error={valid ? undefined : "Enter a full phone number"}
      />
      <Button
        type="submit"
        variant="strong"
        className="self-start text-16"
        disabled={!valid || !changed || saving}
      >
        Save phone
      </Button>
    </form>
  )
}
