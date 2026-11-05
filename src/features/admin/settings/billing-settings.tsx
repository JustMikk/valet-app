"use client"

import { useState } from "react"

import { TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { Settings } from "@/lib/data"

import { parseDollars } from "../events/pay-rate-editor"

/** "6.25" → 625 basis points; null when it isn't a percentage from 0 to 50. */
export function parsePercent(text: string): number | null {
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(text.trim())) return null
  const bp = Math.round(Number(text) * 100)
  return bp <= 5_000 ? bp : null
}

type BillingSettingsProps = {
  billing: Settings["billing"]
  saving: boolean
  onSave: (patch: Settings["billing"]) => void
}

/** Valet pay for new events, and the sales tax added to client invoices (ADR-022). */
export function BillingSettings({ billing, saving, onSave }: BillingSettingsProps) {
  const [rate, setRate] = useState((billing.payRateCents / 100).toFixed(2))
  const [tax, setTax] = useState(String(billing.salesTaxBp / 100))
  const payRateCents = parseDollars(rate)
  const salesTaxBp = parsePercent(tax)
  const changed = payRateCents !== billing.payRateCents || salesTaxBp !== billing.salesTaxBp

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (payRateCents === null || salesTaxBp === null) return
        onSave({ payRateCents, salesTaxBp })
      }}
    >
      <TextField
        label="Valet pay per hour ($)"
        description="New events start with this rate; change it per event on its Pay tab."
        inputMode="decimal"
        value={rate}
        onChange={(event) => setRate(event.target.value)}
        error={payRateCents === null ? "Enter an hourly amount, like 21.00" : undefined}
      />
      <TextField
        label="Sales tax on invoices (%)"
        description="Added to client invoices drafted from now on. Sent invoices don't change."
        inputMode="decimal"
        value={tax}
        onChange={(event) => setTax(event.target.value)}
        error={salesTaxBp === null ? "Enter a percentage, like 6.25" : undefined}
      />
      <Button
        type="submit"
        variant="strong"
        className="self-start text-16"
        disabled={!changed || saving || payRateCents === null || salesTaxBp === null}
      >
        Save pay &amp; billing
      </Button>
    </form>
  )
}
