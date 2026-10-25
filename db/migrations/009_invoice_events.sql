-- Which events a period invoice (built by hand) billed, so the system never drafts a second
-- invoice for the same event. An event invoice carries its event on the invoice itself.

create table invoice_events (
  invoice_id uuid not null references invoices (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  primary key (invoice_id, event_id)
);

create unique index invoice_events_event_key on invoice_events (event_id);
