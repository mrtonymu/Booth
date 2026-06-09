-- Client CRM — create the private Storage bucket for document/photo uploads.
-- Run this in the Supabase SQL editor (idempotent). The server uses the service
-- role key, which bypasses Storage RLS, so no bucket policies are needed.
--
-- (Equivalent to: Dashboard → Storage → New bucket → name "documents", Public OFF.)

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
