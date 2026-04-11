create table if not exists claws (
  id uuid default gen_random_uuid() primary key,
  claw_name text not null,
  telegram_username text,
  railway_project_id text,
  railway_service_id text,
  status text default 'provisioning',
  created_at timestamptz default now()
);

-- Index for status queries
create index if not exists claws_status_idx on claws(status);
create index if not exists claws_created_at_idx on claws(created_at desc);
