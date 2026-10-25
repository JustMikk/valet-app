-- Restore the tenant-scoped staff and dispatch message thread table.
-- This includes columns added by the admin slice after the initial schema.

create table if not exists messages (
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
  read_at timestamptz,
  broadcast_id uuid references broadcasts (id),
  sender_admin_id uuid references admins (id),
  admin_read_at timestamptz
);

create index if not exists messages_thread_idx on messages (staff_id, created_at);

create index if not exists messages_broadcast_idx on messages (broadcast_id)
  where broadcast_id is not null;
