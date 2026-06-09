# Client CRM

Your own customizable client management system. Add your own fields and tags
from the UI — no code changes needed.

自建客户管理系统：字段和标签都能在界面上自己加，不用改代码。

- **Stack**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Clerk (auth) · Supabase (Postgres)
- **Features**: custom fields, tags, search/filter/sort, sales pipeline board (drag & drop), tasks & follow-up reminders, dashboard, follow-up timeline, CSV import/export, light/dark mode
- **Data ownership**: every row is scoped to your Clerk user id (`owner_id`). All
  database access happens server-side with the Supabase service role key — the
  key is never shipped to the browser.

---

## 1. Prerequisites / 准备

- Node.js 20.9+ (you have v24 ✅)
- A free [Clerk](https://clerk.com) account (authentication)
- A free [Supabase](https://supabase.com) project (database)

## 2. Configure environment / 配置环境变量

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

**Clerk** → dashboard.clerk.com → your app → *API keys*:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Supabase** → Project Settings:
- `SUPABASE_URL` — *Data API* → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` — *API Keys* → `service_role` (secret!)

## 3. Create the database tables / 建表

In the Supabase dashboard, open **SQL Editor** and run BOTH migration files in
order:

```text
supabase/migrations/0001_init.sql
supabase/migrations/0002_pipeline_tasks.sql
supabase/migrations/0003_documents.sql
supabase/migrations/0004_stages_and_soft_delete.sql
supabase/migrations/0005_app_settings.sql
supabase/migrations/0006_appointments.sql
supabase/migrations/0007_storage_bucket.sql
```

These create all tables and columns: clients (incl. `stage`, soft-delete, and
the `appointment_at` date/time), custom fields, tags, tasks, activities,
documents, pipeline stages, and settings. `0007` also creates the private
**`documents` Storage bucket** used for photo/file uploads (downloads use
short-lived signed URLs). All tables have RLS locked to the service role.

> Already ran 0001–0005? Just run the new ones: **`0006_appointments.sql`**
> (appointment date/time) and **`0007_storage_bucket.sql`** (file uploads).

> Prefer the CLI? `supabase db push` works if you've linked the project with
> the [Supabase CLI](https://supabase.com/docs/guides/cli).

## 4. Run locally / 本地运行

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to sign in. Create your
account, then you're in. (To make it single-user, disable sign-ups in the Clerk
dashboard after registering once.)

---

## How it works / 工作原理

- **Custom fields** live in `field_definitions`. The client form and table read
  this table and render inputs/columns dynamically. Values are stored per client
  in a `custom_data` JSONB column — so adding a field never needs a migration.
- **Tags** are many-to-many via `client_tags`.
- **Activity timeline** is the `activities` table, newest first.
- **Search/filter/sort** is driven by URL query params and resolved in a single
  server-side query (`lib/data/clients.ts`).
- **CSV**: export streams from `/api/clients/export`; import parses client-side
  with PapaParse and bulk-inserts via a server action (matches columns to your
  field labels).

### Project structure

```
app/(app)/        Authenticated pages (clients, settings) — share the sidebar shell
app/sign-in|up/   Clerk hosted auth pages
app/api/clients/  CSV export route handler
lib/data/         Data-access layer (all queries scoped by owner_id)
lib/supabase/     Server-only service-role client
components/        UI primitives + feature components
proxy.ts          Clerk auth (Next 16's renamed "middleware")
```

---

## 5. Deploy to Vercel / 部署

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the **same environment variables** (all of them from `.env.example`) in
   Vercel → Project → Settings → Environment Variables.
4. In the Clerk dashboard, add your production domain (`your-app.vercel.app`) to
   the allowed origins.
5. Deploy. Done.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
