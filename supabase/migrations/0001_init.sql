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
