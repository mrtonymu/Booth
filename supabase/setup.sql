-- Client CRM — initial schema
-- Auth is handled by Clerk; data is scoped by owner_id (the Clerk user id).
-- All access goes through the server using the service role key, so RLS is
-- enabled with NO policies as defence-in-depth: the anon/public key can read
-- nothing, while the service role bypasses RLS for our server queries.

create extension if not exists pgcrypto;

-- updated_at trigger helper -------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- clients -------------------------------------------------------------------
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,
  name        text not null,
  phone       text,
  email       text,
  custom_data jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists clients_owner_idx on clients (owner_id);
create index if not exists clients_owner_name_idx on clients (owner_id, name);
create index if not exists clients_custom_gin on clients using gin (custom_data);

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- field_definitions (user-defined custom fields) ----------------------------
create table if not exists field_definitions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,
  key        text not null,
  label      text not null,
  type       text not null default 'text',
  options    jsonb not null default '[]'::jsonb,
  position   int not null default 0,
  required   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, key)
);
create index if not exists field_defs_owner_idx on field_definitions (owner_id, position);

-- tags ----------------------------------------------------------------------
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,
  name       text not null,
  color      text not null default 'gray',
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);
create index if not exists tags_owner_idx on tags (owner_id);

create table if not exists client_tags (
  client_id uuid not null references clients (id) on delete cascade,
  tag_id    uuid not null references tags (id) on delete cascade,
  primary key (client_id, tag_id)
);
create index if not exists client_tags_tag_idx on client_tags (tag_id);

-- activities (follow-up timeline) -------------------------------------------
create table if not exists activities (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  owner_id   text not null,
  type       text not null default 'note',
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists activities_client_idx on activities (client_id, created_at desc);

-- Lock everything down to the service role (defence in depth) ---------------
alter table clients           enable row level security;
alter table field_definitions enable row level security;
alter table tags              enable row level security;
alter table client_tags       enable row level security;
alter table activities        enable row level security;
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
-- Client CRM — document/file attachments
-- Run after 0002. Files themselves live in a Supabase Storage bucket named
-- "documents" (create it as a PRIVATE bucket in the dashboard). This table
-- stores metadata + the storage path; downloads use short-lived signed URLs.

create table if not exists documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null,
  client_id  uuid not null references clients (id) on delete cascade,
  name       text not null,
  mime       text,
  size       bigint,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists documents_client_idx on documents (client_id, created_at desc);
create index if not exists documents_owner_idx on documents (owner_id);

alter table documents enable row level security;

-- ⚠️ Also create a PRIVATE Storage bucket named "documents":
--   Dashboard → Storage → New bucket → name "documents", Public = OFF.
-- The server uses the service role key, which bypasses bucket policies.
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
