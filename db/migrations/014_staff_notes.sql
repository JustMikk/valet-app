-- Private admin notes on a valet (ADR-024): what the numbers don't show, kept for decisions.
create table staff_notes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id) on delete cascade,
  admin_id uuid references admins (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index staff_notes_staff_idx on staff_notes (staff_id, created_at desc);
