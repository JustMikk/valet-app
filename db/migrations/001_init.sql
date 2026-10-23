-- Demo schema for the staff API (docs/DECISIONS.md ADR-012). Tenant-scoped from day one; the admin
-- side extends these tables. Bill rates live on venues/invoices and are added with the admin slice:
-- staff queries never select them (handoff §5.4).
-- Statements end with a semicolon at the end of a line (scripts/db-migrate.mjs splits on that).

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  accent text not null default '#C9A24A',
  created_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  name text not null,
  email text not null,
  phone text not null default '',
  role_label text not null default 'Valet attendant',
  active boolean not null default true,
  push_enabled boolean not null default true,
  location_enabled boolean not null default true,
  camera_enabled boolean not null default true,
  installed boolean not null default false,
  notify_open boolean not null default true,
  notify_remind boolean not null default true,
  notify_msg boolean not null default true,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index staff_email_key on staff (lower(email));

create table venues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  name text not null,
  address text not null,
  short_address text not null,
  maps_url text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null default 150,
  min_accuracy_m integer not null default 75,
  timezone text not null default 'America/Los_Angeles'
);

create table events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  venue_id uuid not null references venues (id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  crew_size integer not null,
  clock_in_window_min integer not null default 15,
  contact_text text not null,
  contact_name text not null,
  contact_tel text not null,
  dress_code text not null,
  instructions text not null default '',
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index events_starts_idx on events (starts_at);

-- One row per crew slot. An open slot has no staff; a held slot has exactly one.
create table assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  staff_id uuid references staff (id),
  status text not null default 'open'
    check (status in ('open', 'confirmed', 'claimed', 'completed', 'no_show')),
  claimed_at timestamptz,
  clocked_in_at timestamptz,
  clocked_out_at timestamptz,
  hours_status text not null default 'in_review' check (hours_status in ('in_review', 'approved')),
  created_at timestamptz not null default now(),
  check ((status = 'open') = (staff_id is null))
);

create index assignments_staff_idx on assignments (staff_id) where staff_id is not null;

create index assignments_event_idx on assignments (event_id);

create unique index assignments_event_staff_key on assignments (event_id, staff_id)
  where staff_id is not null;

create table drops (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  staff_id uuid not null references staff (id),
  reason text not null,
  note text,
  late boolean not null,
  created_at timestamptz not null default now()
);

-- Every clock-in / clock-out, including offline replays and out-of-fence approval requests.
create table punches (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  staff_id uuid not null references staff (id),
  kind text not null check (kind in ('in', 'out')),
  idempotency_key text not null unique,
  device_at timestamptz not null,
  server_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  accuracy_m double precision,
  distance_m integer,
  geofence text not null check (geofence in ('inside', 'outside', 'low_accuracy', 'unknown')),
  selfie boolean not null default false,
  offline boolean not null default false,
  status text not null check (status in ('accepted', 'pending_approval', 'approved', 'rejected')),
  note text,
  decided_at timestamptz
);

create index punches_assignment_idx on punches (assignment_id, kind);

create table messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id),
  staff_id uuid not null references staff (id),
  sender text not null check (sender in ('staff', 'dispatch', 'broadcast')),
  sender_name text,
  body text not null,
  ref_label text,
  image_label text,
  event_id uuid references events (id),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);

create index messages_thread_idx on messages (staff_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id),
  dedupe_key text,
  icon text not null,
  tone text not null check (tone in ('accent', 'info', 'ok', 'warn')),
  title text not null,
  body text not null,
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_staff_idx on notifications (staff_id, created_at desc);

create unique index notifications_dedupe_key on notifications (staff_id, dedupe_key)
  where dedupe_key is not null;
