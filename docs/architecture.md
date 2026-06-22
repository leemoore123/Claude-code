# Architecture notes

## Stack
- **Web:** React + TypeScript + Vite + Tailwind. FullCalendar (Phase 2),
  react-hook-form + Zod for the forms engine (Phase 3).
- **API:** NestJS — OAuth/webhook controllers, background workers.
- **DB:** PostgreSQL via Supabase (Auth, Storage, Realtime, RLS). Prisma ORM.
- **Queue:** BullMQ + Redis (Upstash) — PPM materialization, Zoho push/pull,
  PDF rendering, e-sign polling.
- **PDF:** Playwright HTML→PDF worker.

## Data model
See `packages/db/prisma/schema.prisma`. Multi-tenant root `Organization`; every
tenant row carries `orgId` for RLS. Zoho IDs are stored inline for fast lookups
AND normalized in `ZohoSyncMap` (the authority for bidirectional sync).

Hierarchy: `Client → Contract → Site (data_centre|vessel) → Asset
(chiller|crac|fan_wall|…)`. Jobs link to assets (M:N) and engineers
(`JobAssignment`); PPM rules drive job materialization; form templates are
versioned and submissions snapshot the schema.

## Scheduling
`computeNextDue()` in `@fsm/shared` is the single source of truth for due-date
maths, used by both the API materializer and the UI. The materializer creates a
`Job` only inside a configurable lead window; the DB unique constraint on
`(sourcePpmRuleId, dueCycleDate)` makes re-runs idempotent.

## Forms engine
Forms are **data** (`FormSchema`), not code. `packages/shared/src/form-templates.ts`
defines every PPM (chiller 6M/1Y/3Y, CRAC, fan wall) and the service/corrective
report. The web `FormRenderer` maps field types → inputs; adding a field type is
the only code change ever needed. Submissions snapshot the schema so old reports
render exactly as filled after a template is revised.

## Zoho integration
All calls go through `ZohoClient` (region-aware via persisted `apiDomain`,
token refresh + rate-limit backoff centralized). Bidirectional sync for
clients/contracts: inbound CRM webhooks + outbound push, reconciled by
`ZohoSyncMap` with field-level last-writer-wins and a manual-resolution queue
surfaced in the Integration view. Start inbound-only, enable outbound once the
map/audit are proven.

## Risk register
1. Bidirectional sync conflicts → sync map + hash/timestamp LWW + manual queue.
2. Zoho rate limits → throttled client on BullMQ, batch APIs, reconciliation.
3. PDF + e-sign → isolated worker + local drawn-signature fallback.
