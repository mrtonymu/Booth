-- Client CRM — built-in appointment date/time on each client.
-- Run after 0005. Stored as a timestamptz (UTC); the app shows it in local time
-- and plots it on the calendar.

alter table clients add column if not exists appointment_at timestamptz;
create index if not exists clients_owner_appt_idx on clients (owner_id, appointment_at);
