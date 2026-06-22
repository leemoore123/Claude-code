-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security for multi-tenant isolation.
-- Applied AFTER `prisma migrate deploy` creates the tables.
--
-- Model:
--   • The API (NestJS workers) connects with the Supabase SERVICE ROLE, which
--     bypasses RLS — so server-side access always works.
--   • The browser never hits Postgres directly except via Storage signed URLs,
--     so RLS here is defense-in-depth + future direct-client access.
--   • Enabling RLS with NO policy = deny-by-default for anon/authenticated.
--   • Org-scoped tables additionally allow an authenticated user to read/write
--     only rows in their own org, resolved from the JWT app_metadata.org_id.
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- Resolve the caller's org from the verified JWT (app_metadata is server-set,
-- users cannot tamper with it). Returns text — Prisma String ids map to text
-- columns, so org comparisons stay text = text.
create or replace function app.current_org_id()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id',
      current_setting('request.jwt.claims', true)::jsonb ->> 'org_id'
    ),
  '')
$$;

-- Enable RLS (deny-by-default) on every tenant table.
do $$
declare t text;
begin
  foreach t in array array[
    'Organization','User','Engineer','Client','Contract','Site','Asset','Contact',
    'Folder','Document','PpmFrequencyRule','Job','JobAsset','JobAssignment',
    'FormTemplate','FormSubmission','FormAttachment','Signature','Part','JobPart',
    'ZohoConnection','ZohoSyncMap','SyncAudit'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

-- Tenant-isolation policies for tables that carry orgId directly.
-- (Child tables remain deny-by-default for authenticated callers and are reached
--  through the service-role API; add finer policies here as direct-client access
--  is introduced.)
drop policy if exists tenant_isolation on public."Organization";
create policy tenant_isolation on public."Organization"
  for all to authenticated
  using (id = app.current_org_id())
  with check (id = app.current_org_id());

do $$
declare t text;
begin
  foreach t in array array['User','Client','Job','Part','ZohoConnection']
  loop
    execute format('drop policy if exists tenant_isolation on public.%I;', t);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated
         using ("orgId" = app.current_org_id())
         with check ("orgId" = app.current_org_id());', t);
  end loop;
end $$;
