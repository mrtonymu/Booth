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
