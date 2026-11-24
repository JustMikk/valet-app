"use client"

import { useId } from "react"

import { Icon, IconButton, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAX_OTHER_RECIPIENTS, type InvoiceDetail, type InvoiceRecipients } from "@/lib/data"

import { emailError } from "./send-invoice"

const FIELDS = [
  { key: "client", label: "Client", placeholder: "billing@venue.com" },
  { key: "manager", label: "Manager", placeholder: "Optional" },
  { key: "accountant", label: "Accountant", placeholder: "Optional" },
] as const

type RecipientsProps = {
  invoice: InvoiceDetail
  value: InvoiceRecipients
  onChange: (next: InvoiceRecipients) => void
  /** False once nothing more can be sent: paid, or sent while email is off. */
  editable: boolean
}

/**
 * Who the invoice is emailed to (ADR-027): the client gets it; the manager, the accountant and any
 * others are copied. Sending saves the list on the venue, so its next invoice starts with it.
 */
export function InvoiceRecipientsCard({ invoice, value, onChange, editable }: RecipientsProps) {
  const titleId = useId()
  const others = value.others
  const setOthers = (next: string[]) => onChange({ ...value, others: next })

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3.5 rounded-r20 border border-line bg-elev p-4.5"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id={titleId} className="m-0 text-17 font-semibold">
          Email to
        </h2>
        <p className="m-0 text-13 leading-x140 text-fg-2">
          {`The client gets the invoice and the others get a copy. Saved for ${invoice.venue}'s next invoices.`}
        </p>
      </div>
      {FIELDS.map((field) => (
        <TextField
          key={field.key}
          label={field.label}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={field.placeholder}
          disabled={!editable}
          value={value[field.key]}
          onChange={(e) => onChange({ ...value, [field.key]: e.target.value })}
          error={emailError(value[field.key])}
        />
      ))}
      {others.length > 0 && (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-15 font-medium">Others</legend>
          {others.map((email, index) => (
            <OtherEmail
              // Rows have no identity beyond their place; the inputs are controlled.
              key={index}
              number={index + 1}
              email={email}
              editable={editable}
              onChange={(next) => setOthers(others.map((e, i) => (i === index ? next : e)))}
              onRemove={() => setOthers(others.filter((_, i) => i !== index))}
            />
          ))}
        </fieldset>
      )}
      {editable && others.length < MAX_OTHER_RECIPIENTS && (
        <Button
          variant="secondary"
          size="compact"
          className="gap-1.5 self-start"
          onClick={() => setOthers([...others, ""])}
        >
          <Icon name="add" size={20} />
          Add email
        </Button>
      )}
      {!invoice.emailReady && !invoice.sent && (
        <p className="m-0 flex items-start gap-2 rounded-r16 bg-surface px-3.5 py-3 text-13 leading-x140 text-fg-2">
          <Icon name="info" filled size={16} className="mt-0.5 flex-none" />
          {"Email isn't set up yet, so Send marks the invoice sent without emailing it."}
        </p>
      )}
      {invoice.sends.length > 0 && <SendHistory sends={invoice.sends} />}
    </section>
  )
}

type OtherProps = {
  number: number
  email: string
  editable: boolean
  onChange: (email: string) => void
  onRemove: () => void
}

function OtherEmail({ number, email, editable, onChange, onRemove }: OtherProps) {
  const errorId = useId()
  const error = emailError(email)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          aria-label={`Other email ${number}`}
          placeholder="name@company.com"
          disabled={!editable}
          value={email}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {editable && (
          <IconButton
            variant="surface"
            icon="close"
            label={email.trim() ? `Remove ${email.trim()}` : `Remove other email ${number}`}
            onClick={onRemove}
          />
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="m-0 text-13 font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  )
}

/** Each time it was emailed, latest first. */
function SendHistory({ sends }: { sends: InvoiceDetail["sends"] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 border-t border-line p-0 pt-3">
      {sends.map((send, index) => (
        <li
          key={`${index}-${send.atLabel}`}
          className="flex items-start gap-2 text-13 leading-x140 [overflow-wrap:anywhere] text-fg-2"
        >
          <Icon name="check_circle" filled size={16} className="mt-0.5 flex-none text-ok" />
          <span>
            Emailed {send.atLabel} to {send.to}
            {send.cc.length > 0 && `, copied to ${send.cc.join(", ")}`}
          </span>
        </li>
      ))}
    </ul>
  )
}
