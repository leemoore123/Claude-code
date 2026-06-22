-- ─────────────────────────────────────────────────────────────────────────────
-- Storage buckets for the FSM platform. Private by default; the API issues
-- short-lived signed URLs. Idempotent.
--   documents   — uploaded site documents (manuals, wiring, RAMS, …)
--   reports     — generated PPM / service PDFs (auto-filed from submissions)
--   signatures  — captured drawn signatures
--   photos      — on-site job photographs / attachments
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents',  'documents',  false, 52428800, null),
  ('reports',    'reports',    false, 52428800, array['application/pdf']),
  ('signatures', 'signatures', false, 5242880,  array['image/png','image/jpeg']),
  ('photos',     'photos',     false, 26214400, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- Deny-by-default: with RLS on storage.objects and no anon/authenticated policy,
-- only the service role (the API) can read/write objects. The API brokers all
-- access and hands out signed URLs. Add per-org object policies here when the
-- browser is given direct Storage access.
alter table storage.objects enable row level security;
