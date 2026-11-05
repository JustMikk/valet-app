-- The Live Board's five counts, saved every few minutes per tenant, so the board can show the
-- change since the same time yesterday (ADR-021). Rows older than eight days are deleted.

create table if not exists pulse_snapshots (
  tenant_id uuid not null references tenants (id) on delete cascade,
  taken_at timestamptz not null,
  need int not null,
  live int not null,
  on_shift int not null,
  expected int not null,
  open int not null,
  primary key (tenant_id, taken_at)
);
