-- Valets and admins sign in with an email or a phone number (ADR-025). The phone key is the
-- number's digits, with a 10-digit number taken as +1; src/lib/contact/contact.ts computes the same.

-- A valet invited by phone has no email: blanks no longer collide.
drop index staff_email_key;

create unique index staff_email_key on staff (lower(email)) where email <> '';

alter table staff add column phone_key text generated always as (
  case
    when length(regexp_replace(phone, '\D', '', 'g')) = 10 then '1' || regexp_replace(phone, '\D', '', 'g')
    when length(regexp_replace(phone, '\D', '', 'g')) between 8 and 15 then regexp_replace(phone, '\D', '', 'g')
  end
) stored;

create unique index staff_phone_key on staff (phone_key) where phone_key is not null;

alter table admins add column phone text not null default '';

alter table admins add column phone_key text generated always as (
  case
    when length(regexp_replace(phone, '\D', '', 'g')) = 10 then '1' || regexp_replace(phone, '\D', '', 'g')
    when length(regexp_replace(phone, '\D', '', 'g')) between 8 and 15 then regexp_replace(phone, '\D', '', 'g')
  end
) stored;

create unique index admins_phone_key on admins (phone_key) where phone_key is not null;
