-- Dispatchers sign in with email and password (staff sign in with their email alone). The hash is
-- scrypt, "scrypt$<salt hex>$<hash hex>"; null means the account cannot sign in with a password
-- (the seeded demo dispatcher, which only the DEMO_MODE shortcut opens).

alter table admins add column password_hash text;
