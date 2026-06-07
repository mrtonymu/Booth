-- Per-user app settings (one row per owner). Currently holds the WhatsApp
-- opening-message template; add more columns here as settings grow.
create table if not exists app_settings (
  owner_id text primary key,
  whatsapp_template text,
  updated_at timestamptz default now()
);

-- Defense-in-depth: RLS on, no policies. All access is server-side via the
-- service-role key (which bypasses RLS), scoped by owner_id in code — same
-- pattern as the other tables.
alter table app_settings enable row level security;
