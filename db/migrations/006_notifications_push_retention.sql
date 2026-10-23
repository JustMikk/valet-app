-- The admin notification center (the bell on every dispatch page), device push subscriptions for
-- both apps, and punch-photo retention (OPEN_QUESTIONS P9: kept 30 days, then deleted).

create table admin_notifications (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins (id) on delete cascade,
  dedupe_key text,
  icon text not null,
  tone text not null check (tone in ('accent', 'info', 'ok', 'warn')),
  title text not null,
  body text not null,
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index admin_notifications_idx on admin_notifications (admin_id, created_at desc);

create unique index admin_notifications_dedupe_key on admin_notifications (admin_id, dedupe_key)
  where dedupe_key is not null;

-- One row per browser/device that allowed push. The owner is a staff or an admin id with no foreign
-- key, so subscriptions survive a demo reset (ids are stable); a dead endpoint is removed when the
-- push service reports it gone.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('staff', 'admin')),
  owner_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_owner_idx on push_subscriptions (role, owner_id);

-- The photo is deleted 30 days after the punch; the fact that a selfie was taken (`selfie`) stays.
alter table punches add column selfie_purged_at timestamptz;

create index punches_selfie_idx on punches (server_at) where selfie_image is not null;
