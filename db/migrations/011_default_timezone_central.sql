-- Switch the default timezone for new tenants/venues from Pacific to Central.
alter table tenants alter column timezone set default 'America/Chicago';
alter table venues alter column timezone set default 'America/Chicago';

-- Carry existing rows still on the old default forward too (demo has a single tenant).
update tenants set timezone = 'America/Chicago' where timezone = 'America/Los_Angeles';
update venues set timezone = 'America/Chicago' where timezone = 'America/Los_Angeles';
