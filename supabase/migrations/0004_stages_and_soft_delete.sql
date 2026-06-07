-- Client CRM — customizable pipeline stages + soft delete for clients
-- Run after 0003.

-- Customizable sales pipeline stages (seeded with defaults on first use).
create table if not exists pipeline_stages (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,
  key        text not null,
  label      text not null,
  color      text not null default 'gray',
  position   int not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, key)
);
create index if not exists pipeline_stages_owner_idx on pipeline_stages (owner_id, position);
alter table pipeline_stages enable row level security;

-- Soft delete: deleted clients go to the trash (recoverable) instead of being removed.
alter table clients add column if not exists deleted_at timestamptz;
create index if not exists clients_owner_deleted_idx on clients (owner_id, deleted_at);
