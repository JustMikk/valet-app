"use client"

import { useId, type ComponentProps } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type SharedProps = {
  label: string
  /** Helper line under the field. */
  description?: string
  /** Validation message; marks the field invalid. */
  error?: string
  className?: string
}

type TextFieldProps =
  | (SharedProps & { multiline?: false } & Omit<ComponentProps<typeof Input>, "className">)
  | (SharedProps & { multiline: true } & Omit<ComponentProps<typeof Textarea>, "className">)

/** Label / input / helper (Design System "field"), with error wiring for assistive tech. */
export function TextField(props: TextFieldProps) {
  const { label, description, error, className, multiline, ...control } = props
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ")
  const a11y = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  }

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={id} className="text-15 font-medium text-fg">
        {label}
      </FieldLabel>
      {multiline ? (
        <Textarea {...(control as ComponentProps<typeof Textarea>)} {...a11y} />
      ) : (
        <Input {...(control as ComponentProps<typeof Input>)} {...a11y} />
      )}
      {description && (
        <FieldDescription id={descriptionId} className="text-13 text-fg-2">
          {description}
        </FieldDescription>
      )}
      {error && (
        <FieldError id={errorId} className="text-13 font-medium text-bad">
          {error}
        </FieldError>
      )}
    </Field>
  )
}
