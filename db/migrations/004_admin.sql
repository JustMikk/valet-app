-- Admin (dispatch) side, ADR-014. Bill rates live only on venues and invoices: the staff API never
-- selects them (handoff §5.4). Money is integer cents.

create table admins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  name text not null,
  email text not null,
  role_label text not null default 'Owner · Admin',
  created_at timestamptz not null default now()
);

create unique index admins_email_key on admins (lower(email));

-- Tenant clock-in rules (Settings screen).
alter table tenants add column clock_window_min integer not null default 15;

alter table tenants add column default_radius_m integer not null default 150;

alter table tenants add column min_accuracy_m integer not null default 75;

alter table tenants add column selfie_required boolean not null default true;

alter table tenants add column flag_early_out boolean not null default true;

alter table staff add column invited_at timestamptz;

alter table staff add column device_label text;

alter table venues add column bill_rate_cents integer not null default 0;

alter table venues add column contact_text text not null default '';

alter table venues add column dress_code text not null default '';

alter table venues add column billing_email text not null default '';

alter table events add column kind text not null default '';

alter table events add column posted_at timestamptz not null default now();

alter table assignments add column assigned_by uuid references admins (id);

alter table assignments add column assigned_at timestamptz;

-- Who dropped or was removed from a slot, so an open slot can say why it is open.
alter table drops add column removed_by uuid references admins (id);

alter table punches add column decided_by uuid references admins (id);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  admin_id uuid not null references admins (id),
  audience text not null check (audience in ('event', 'tonight', 'all')),
  audience_label text not null,
  event_id uuid references events (id),
  body text not null,
  recipients integer not null,
  created_at timestamptz not null default now()
);

alter table messages add column broadcast_id uuid references broadcasts (id);

alter table messages add column sender_admin_id uuid references admins (id);

alter table messages add column admin_read_at timestamptz;

create index messages_broadcast_idx on messages (broadcast_id) where broadcast_id is not null;

-- Audit trail for hours edits (handoff §9 slice 7: edits require a reason and write audit entries).
create table hours_adjustments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  admin_id uuid not null references admins (id),
  old_in timestamptz,
  old_out timestamptz,
  new_out timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  venue_id uuid not null references venues (id),
  number text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  billed_to text not null default '',
  sent_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  total_cents integer not null,
  minutes integer not null,
  notice text,
  created_at timestamptz not null default now()
);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  position integer not null,
  what text not null,
  staff_count integer not null,
  minutes integer not null,
  rate_cents integer not null,
  amount_cents integer not null
);
