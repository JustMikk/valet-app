-- Event pay sheet and invoice sales tax (ADR-022). Valets are paid at the event's own hourly rate,
-- which starts from the tenant's default; each worked shift can be marked paid and tipped. Client
-- invoices add sales tax on top of the hours billed.

alter table tenants add column pay_rate_cents integer not null default 2100;

-- Basis points: 625 is 6.25 %.
alter table tenants add column sales_tax_bp integer not null default 625;

alter table events add column pay_rate_cents integer not null default 2100;

update events e set pay_rate_cents = t.pay_rate_cents from tenants t where t.id = e.tenant_id;

-- What was paid is kept as paid, even if the event's rate changes afterwards.
alter table assignments add column paid_at timestamptz;

alter table assignments add column paid_cents integer;

alter table assignments add constraint assignments_paid_check check ((paid_at is null) = (paid_cents is null));

alter table assignments add column tips boolean not null default false;

alter table invoices add column tax_bp integer not null default 0;

alter table invoices add column tax_cents integer not null default 0;

-- Drafts pick up the tax now; invoices already sent stay as they were sent.
update invoices set tax_bp = 625, tax_cents = round(total_cents * 625 / 10000.0) where status = 'draft';
