-- Invoices drafted automatically per event (product spec §10.3: one per event in the MVP). The
-- period invoices from the admin slice keep working; they simply have no event.

alter table invoices add column event_id uuid references events (id) on delete set null;

-- "Wedding · Nov 8" for the list, and the full line under the venue name on the invoice.
alter table invoices add column label text;

alter table invoices add column summary text;

-- One line per worker: the in and out times, so the venue can see who worked when.
alter table invoice_lines add column detail text not null default '';

create unique index invoices_event_key on invoices (event_id) where event_id is not null;
