-- A venue's on-site contact (name and phone); new events copy it so staff can call from the shift.

alter table venues add column contact_name text not null default '';

alter table venues add column contact_tel text not null default '';
