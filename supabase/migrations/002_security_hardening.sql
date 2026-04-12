-- Migration 002: Security hardening
-- - Add email column for user contact
-- - Add gateway_token_hash (sha256 hex) — never store plaintext
-- - Add railway_domain
-- - Remove gateway_token plaintext column if it exists
-- - Enable Row Level Security (RLS)

-- Add columns if they don't exist
alter table claws add column if not exists email text;
alter table claws add column if not exists railway_domain text;
alter table claws add column if not exists gateway_token_hash text;

-- Drop plaintext token column if it was ever created
alter table claws drop column if exists gateway_token;

-- Index on email for lookups
create index if not exists claws_email_idx on claws(email);

-- Enable Row Level Security
alter table claws enable row level security;

-- Policy: service role (server) can do anything — used by our API routes
-- Anon/authenticated users get nothing by default (no client-side access)
-- This means the anon key exposed in NEXT_PUBLIC_ cannot read/write the table.
create policy "service role full access"
  on claws
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- No policies for anon or authenticated roles = denied by default.
-- If you add auth later, add policies like:
--   using (auth.uid() = user_id)
