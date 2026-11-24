-- Invoices and email invites go out by email (ADR-027).

-- Besides the billing email (the client, who gets the invoice), a venue keeps who is copied on its
-- invoices: the manager, the accountant and any others. Blank means nobody.
alter table venues
  add column manager_email text not null default '',
  add column accountant_email text not null default '',
  add column cc_emails text[] not null default '{}';

-- Each time an invoice was emailed: to whom, who was copied, when, and Resend's id for the email.
create table invoice_sends (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  sent_by uuid references admins (id) on delete set null,
  to_email text not null,
  cc_emails text[] not null default '{}',
  email_id text not null,
  sent_at timestamptz not null default now()
);
create index invoice_sends_invoice on invoice_sends (invoice_id, sent_at desc);
