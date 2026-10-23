-- Tenant-level clock for notification stamps; punches that land flagged for admin review
-- (offline replays that disagree with the fence, clock-outs outside it: product spec §8.4, §8.6).

alter table tenants add column timezone text not null default 'America/Los_Angeles';

alter table punches add column flagged boolean not null default false;

alter table punches add column flag_reason text;
