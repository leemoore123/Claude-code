# Supabase setup

One script stands up the whole database layer: schema, RLS, storage buckets and
demo data. It works against a **hosted** Supabase project or the **local** CLI
stack.

```
infra/supabase/
  config.toml     # local CLI stack (supabase start)
  policies.sql    # RLS + tenant isolation (app.current_org_id helper)
  storage.sql     # storage buckets + object RLS
packages/db/prisma/migrations/0_init/   # baseline schema migration
scripts/setup-supabase.sh               # orchestrator
```

## Option A — Hosted Supabase project

1. Create a project at supabase.com (choose the region nearest Riyadh/Doha).
2. Copy `.env.example` → `.env` and set the Postgres connection string from
   **Project → Settings → Database**:
   ```
   DATABASE_URL="postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
   DIRECT_URL="$DATABASE_URL"   # the 5432 session connection (not the 6543 pooler)
   ```
   Also fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   (Project → Settings → API) for the app/runtime.
3. Run:
   ```bash
   pnpm install
   pnpm supabase:setup        # migrate → policies → buckets → seed
   ```

## Option B — Local stack (Docker + Supabase CLI)

```bash
pnpm supabase:start          # boots Postgres/Auth/Storage, prints local keys
# export the local DB URL it shows into .env (DATABASE_URL/DIRECT_URL), then:
pnpm supabase:setup
```

`supabase:start` reads `infra/supabase/config.toml`.

## What the script does

`scripts/setup-supabase.sh`:

1. **Prisma client** — `prisma generate`
2. **Migrations** — `prisma migrate deploy` (applies `0_init`, all tables/enums)
3. **RLS** — applies `policies.sql`: enables row-level security (deny-by-default)
   on all 23 tenant tables, creates `app.current_org_id()` (reads the verified
   JWT `app_metadata.org_id`), and tenant-isolation policies on the org-scoped
   tables. The service role bypasses RLS, so the API always works; the browser
   only reaches data through the API + signed URLs.
4. **Storage** — applies `storage.sql`: creates the `documents`, `reports`,
   `signatures`, `photos` buckets (private) and enables object RLS.
5. **Seed** — loads the QST + Fincantieri demo data (skip with `--no-seed`).

All steps are idempotent — safe to re-run.

## Verified

The migration, seed, `policies.sql` and `storage.sql` were run end-to-end against
a real PostgreSQL 16 instance: 0_init applies cleanly, the seed creates 2 clients
/ 4 sites / 7 assets / 7 PPM rules / 36 folders / 6 form templates, RLS lands on
23 tables with 6 tenant-isolation policies, and the 4 storage buckets are
created. `policies.sql`/`storage.sql` re-run without error.

> Note: `policies.sql`/`storage.sql` reference Supabase-managed roles
> (`anon`, `authenticated`, `service_role`) and the `storage` schema, which exist
> automatically on Supabase. They are not needed on a plain Postgres.
