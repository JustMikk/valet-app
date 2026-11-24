import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import type { InvoiceDetail, InvoiceRecipients } from "@/lib/data"

import { InvoiceRecipientsCard } from "./invoice-recipients"
import { emailError, recipientsProblem, tidyRecipients } from "./send-invoice"

const LIST: InvoiceRecipients = {
  client: "billing@grand.com",
  manager: "",
  accountant: "",
  others: [],
}

const invoice: InvoiceDetail = {
  id: "inv",
  number: "INV-2026-0142 · DRAFT",
  venue: "The Grand Hotel",
  period: "Nov 1 – 15, 2026 · from approved hours",
  subtotalCents: 100_000,
  taxBp: 0,
  taxCents: 0,
  totalCents: 100_000,
  notice: null,
  billedTo: LIST.client,
  sent: false,
  recipients: LIST,
  sends: [],
  emailReady: true,
  canResend: false,
  lines: [],
}

function Harness({ start = LIST, editable = true }) {
  const [value, setValue] = useState(start)
  return (
    <InvoiceRecipientsCard
      invoice={invoice}
      value={value}
      onChange={setValue}
      editable={editable}
    />
  )
}

describe("recipient checks", () => {
  it("flags only filled fields that are not addresses", () => {
    expect(emailError("")).toBeUndefined()
    expect(emailError(" gm@grand.com ")).toBeUndefined()
    expect(emailError("gm@grand")).toBe("Enter a full email address")
  })

  it("needs the client, and every filled field valid", () => {
    expect(recipientsProblem(LIST)).toBeNull()
    expect(recipientsProblem({ ...LIST, client: " " })).toBe("Add the client's email")
    expect(recipientsProblem({ ...LIST, others: ["nope"] })).toBe("Check the emails")
  })

  it("tidies the list as it is sent", () => {
    expect(
      tidyRecipients({ ...LIST, manager: " GM@Grand.com", others: ["", " AP@grand.com"] }),
    ).toEqual({ ...LIST, manager: "gm@grand.com", others: ["ap@grand.com"] })
  })
})

describe("InvoiceRecipientsCard", () => {
  it("shows client, manager and accountant, all editable", () => {
    render(<Harness />)
    const client = screen.getByLabelText("Client")
    expect(client).toHaveValue("billing@grand.com")
    fireEvent.change(client, { target: { value: "ap@grand.com" } })
    expect(client).toHaveValue("ap@grand.com")
    expect(screen.getByLabelText("Manager")).toBeEnabled()
    expect(screen.getByLabelText("Accountant")).toBeEnabled()
  })

  it("adds and removes other emails", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Add email" }))
    const other = screen.getByLabelText("Other email 1")
    fireEvent.change(other, { target: { value: "owner@grand.com" } })
    fireEvent.click(screen.getByRole("button", { name: "Remove owner@grand.com" }))
    expect(screen.queryByLabelText("Other email 1")).not.toBeInTheDocument()
  })

  it("says when a field is not an email address", () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText("Manager"), { target: { value: "gm@" } })
    expect(screen.getByText("Enter a full email address")).toBeInTheDocument()
  })

  it("is read-only once nothing more can be sent", () => {
    render(<Harness editable={false} start={{ ...LIST, others: ["ap@grand.com"] }} />)
    expect(screen.getByLabelText("Client")).toBeDisabled()
    expect(screen.getByLabelText("Other email 1")).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Add email" })).not.toBeInTheDocument()
  })
})
