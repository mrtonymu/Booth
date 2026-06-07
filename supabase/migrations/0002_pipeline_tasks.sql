-- Client CRM — pipeline stage + tasks
-- Run this after 0001_init.sql.

-- Pipeline stage on each client (key from PIPELINE_STAGES in lib/types.ts).
alter table clients add column if not exists stage text not null default 'new';
create index if not exists clients_owner_stage_idx on clients (owner_id, stage);

-- Tasks / follow-up reminders (optionally linked to a client).
create table if not exists tasks (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,
  client_id  uuid references clients (id) on delete cascade,
  title      text not null,
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_owner_idx on tasks (owner_id, done, due_date);
create index if not exists tasks_client_idx on tasks (client_id);

alter table tasks enable row level security;
