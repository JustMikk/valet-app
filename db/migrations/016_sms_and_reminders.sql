-- SMS (ADR-026): every text the app tries to send, and the shift reminders already sent.

-- One row per text: what kind, to whom (last 4 digits only, never the body), and what became of it.
-- status: pending, skipped, failed, opted_out, or a Twilio status (accepted, queued, sent,
-- delivered, undelivered, ...) kept current by the status callback.
create table sms_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  staff_id uuid references staff (id) on delete set null,
  kind text not null check (kind in
    ('invite', 'reminder24', 'reminder1', 'cancelled', 'assigned', 'rescheduled', 'removed')),
  dedupe_key text,
  to_last4 text not null default '',
  status text not null default 'pending',
  skip_reason text,
  twilio_sid text unique,
  error_code integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sms_messages_staff_idx on sms_messages (staff_id, created_at desc);

create index sms_messages_dedupe_idx on sms_messages (dedupe_key, created_at desc)
  where dedupe_key is not null;

-- A reminder is sent once per assignment, offset and start time: inserting the row claims the send,
-- and a rescheduled shift (new starts_at) gets fresh reminders.
create table shift_reminders (
  assignment_id uuid not null references assignments (id) on delete cascade,
  offset_hours integer not null check (offset_hours in (24, 1)),
  starts_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (assignment_id, offset_hours, starts_at)
);
