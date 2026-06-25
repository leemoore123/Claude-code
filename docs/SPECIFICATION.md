# QEY FSM — Project Specification

> A build-from-scratch specification for the QEY Technical **Field Service
> Management (FSM)** platform. This document is self-contained: an engineer (or
> Claude) should be able to reconstruct the system from this alone. It reflects
> the implementation through Phase 3; Phases 4–5 are specified as design.

---

## 1. Purpose & Context

QEY Technical runs an HVAC field-service operation serving **multiple clients
under contracts** (e.g. **QST HVAC** — data centres in Riyadh; **Fincantieri
Qatar** — a 6-vessel naval fleet in Doha). The business previously had two
static single-file HTML "document portals" (one per client) that only managed
documents. This platform supersedes them with a true FSM:

- Multiple clients & contracts in one system.
- An asset hierarchy: **Client → Contract → Site/Vessel → Asset**.
- **Site/engineer scheduling** with auto-generated recurring PPM due dates
  (6-month / 1-year / 3-year frequencies) and a dispatch workflow.
- A **data-driven forms engine** generating all PPM and service/corrective
  forms, with on-screen fill, validation, PDF export, and sign-off.
- **Bidirectional Zoho sync** (CRM / Books / Sign / Inventory) — clients &
  contracts are the headline integration.

The visual language of the original portals is preserved (navy/blue, IBM Plex,
Tabler icons, card grids, folder browser, modals, toasts).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query, `@tabler/icons-react` |
| Backend | NestJS 10 (Node 20+, TypeScript) |
| Database | PostgreSQL via Supabase (Auth, Storage, Realtime, Row-Level Security) |
| ORM | Prisma 5 |
| PDF | Playwright (headless Chromium), HTML→PDF |
| Queue (future) | BullMQ + Redis (Upstash) — Phase 4/5 for Zoho sync & PDF workers |
| Package manager | pnpm workspaces (monorepo) |
| Hosting | Web → Vercel/Netlify; API+workers → Render/Railway/Fly; DB/Auth/Storage → Supabase; Redis → Upstash |

**Monorepo layout**

```
/                      pnpm-workspace.yaml, tsconfig.base.json, .env.example
apps/
  web/                 React + Vite + Tailwind  (package @fsm/web)
  api/                 NestJS                    (package @fsm/api)
packages/
  db/                  Prisma schema + migrations + seed   (@fsm/db)
  shared/              shared types, domain helpers, form templates (@fsm/shared)
infra/supabase/        config.toml, policies.sql, storage.sql
scripts/               setup-supabase.sh
docs/                  architecture.md, supabase-setup.md, SPECIFICATION.md
demo/                  FSM_Demo.html (standalone no-build demo)
```

**Package boundaries that matter**
- `@fsm/shared` compiles to **CommonJS `dist/`** (the Node API consumes built JS;
  the web app aliases it to source via Vite). It holds the form-template
  definitions and `computeNextDue()` — the single source of truth used by both
  API and UI.
- The API imports `PrismaClient` from `@prisma/client` directly (not `@fsm/db`)
  so it never loads raw TS at runtime.
- `apps/api/tsconfig.json` sets `declaration: false` (avoids Prisma TS2742).

---

## 3. Data Model (Prisma / PostgreSQL)

Multi-tenant root: **Organization**; tenant tables carry `orgId` where directly
queried. Zoho record IDs are stored inline **and** normalized in `ZohoSyncMap`
(the authority for sync). String ids are `text` columns (Prisma `@default(uuid())`).

### Enums
- `UserRole`: super_admin | ops_manager | dispatcher | engineer | client_rep
- `SiteType`: data_centre | vessel
- `AssetType`: chiller | crac | fan_wall | ahu | pump | other
- `PpmFrequency`: monthly | quarterly | six_month | one_year | three_year | custom
- `JobType`: ppm | corrective | install | survey
- `JobStatus`: scheduled | dispatched | en_route | on_site | in_progress | completed | signed_off | invoiced | cancelled | on_hold
- `DispatchStatus`: assigned | accepted | en_route | on_site | done
- `SubmissionStatus`: draft | completed | pending_signature | signed | void
- `SignerRole`: engineer | client_rep
- `SignatureMethod`: drawn | zoho_sign
- `ZohoService`: crm | books | sign | inventory | fsm
- `SyncDirection`: inbound | outbound | both
- `SyncStatus`: in_sync | pending | conflict | error

### Entities (fields → relationships)
- **Organization** (id, name, settings) → Users, Clients, Parts, ZohoConnections
- **User** (id, orgId, email unique, fullName, role, phone, active) → Engineer?, JobAssignments, submissions, uploads
- **Engineer** (userId unique, skills[], homeBase, zohoFsmAgentId)
- **Client** (id, orgId, name, billingAddress, primaryContact, status, **zohoCrmAccountId**) → Contracts, Sites, Contacts, Jobs, Folders
- **Contract** (id, clientId, name, startDate, endDate, value Decimal, status, slaTerms, **zohoCrmDealId**, **zohoBooksCustomerId**) → Sites, Jobs
- **Site** (id, clientId, contractId?, siteType, name, code, region, hullNumber, metadata json) → Assets, Folders, Jobs, Contacts
- **Asset** (id, siteId, assetType, tag, manufacturer, model, serial, installDate, locationInSite, metadata) → PpmFrequencyRules, JobAssets, submissions
- **Contact** (id, clientId?, siteId?, name, title, function, email, phone, **zohoCrmContactId**)
- **Folder** (id, siteId?, clientId?, parentId? self-FK tree, name) → Documents
- **Document** (id, folderId, name, storagePath, mime, version, uploadedById?, **linkedSubmissionId? unique**) — generated PDFs auto-file here
- **PpmFrequencyRule** (id, assetId, frequency, customIntervalDays?, scopeLabel, anchorDate, lastCompletedDate?, nextDueDate?, formTemplateId?, active) → Jobs
- **Job** (id, orgId, clientId, siteId, contractId?, jobType, sourcePpmRuleId?, dueCycleDate?, status, scheduledStart, scheduledEnd, priority, summary, **zohoFsmWorkorderId**, **zohoBooksInvoiceId**) → JobAssets, JobAssignments, FormSubmissions, JobParts. **`@@unique([sourcePpmRuleId, dueCycleDate])`** (idempotent materialization)
- **JobAsset** (jobId, assetId) — M:N, composite PK
- **JobAssignment** (id, jobId, engineerId, roleOnJob, dispatchStatus, assignedAt) — `@@unique([jobId, engineerId])`
- **FormTemplate** (id, name, version, assetType?, jobType, ppmScope?, **schema json**, pdfLayout?, requiresSignoff, active) → FormSubmissions, PpmFrequencyRules
- **FormSubmission** (id, jobId, assetId?, formTemplateId, templateVersion, **schemaSnapshot json**, **answers json**, status, engineerId?, completedAt, pdfUrl, signedPdfUrl, zohoSignRequestId) → Signatures, FormAttachments, Document?
- **FormAttachment** (id, submissionId, type, storagePath, caption)
- **Signature** (id, submissionId, signerRole, signerName, signerEmail, method, imagePath, zohoSignActionId, signedAt)
- **Part** (id, orgId, sku, name, description, unitCost, **zohoInventoryItemId**) — `@@unique([orgId, sku])`
- **JobPart** (id, jobId, partId, qtyUsed, unitPrice)
- **ZohoConnection** (id, orgId, service, accessToken*, refreshToken*, expiresAt, apiDomain, scopes, connectedById) — `@@unique([orgId, service])`; tokens encrypted at rest
- **ZohoSyncMap** (id, entityType, localId, zohoService, zohoModule, zohoRecordId, localHash, localVersion, remoteModifiedTime, lastSyncedAt, syncDirection, syncStatus) — `@@unique([entityType, localId, zohoService])` and `@@unique([zohoService, zohoModule, zohoRecordId])`
- **SyncAudit** (id, entity, localId?, zohoId?, direction, payloadHash, result, error, createdAt) — append-only

---

## 4. Shared Domain Logic (`@fsm/shared`)

### `computeNextDue(frequency, anchorDate, lastCompletedDate, customIntervalDays?) → Date`
`next = lastCompletedDate ? max(anchorDate, lastCompletedDate + interval) : anchorDate`.
Interval days: monthly 30, quarterly 91, six_month 182, one_year 365,
three_year 1095, custom = `customIntervalDays`. Used by both the API
materializer and the UI.

### Form schema types
```ts
type FieldType = 'text'|'textarea'|'number'|'select'|'multiselect'|'checkbox'
               |'date'|'reading'|'attachment'|'signature';
interface FormField { key; label; type; unit?; required?; options?; multiple?;
                      min?; max?; help? }   // reading uses min/max as pass band
interface FormSection { title; description?; fields: FormField[] }
interface FormSchema { key; title; assetType?; jobType?; ppmScope?;
                       sections: FormSection[]; requiresSignoff? }
```

### Form templates (the "all forms" requirement — data-driven, no hard-coded UI)
Shared module exports `ALL_FORM_TEMPLATES`, keyed by `(assetType, jobType, ppmScope)`:
1. **chiller_ppm_6m** — Chiller PPM 6-Monthly (Electrical incl. supply voltages
   with 380–420 V pass band, Refrigeration circuit, Water/Condenser, Controls &
   Safety, Observations, Sign-off)
2. **chiller_ppm_1y** — Annual (adds oil analysis, condenser clean, megger, thermography)
3. **chiller_ppm_3y** — 3-Yearly major (EXV service, calibration, contactor replace, recharge)
4. **crac_ppm** — CRAC/CRAH (air side, cooling & humidification, electrical/controls)
5. **fan_wall_ppm** — Fan wall (fan array, electrical, airflow & redundancy)
6. **service** — Service/Corrective report (call details, diagnosis, work done)

Adding an asset type or revising a checklist is **pure data** — the only code
change ever needed is adding a new `FieldType` to the renderer.

---

## 5. API (NestJS) — Endpoints

Base URL from `VITE_API_BASE_URL` (default `http://localhost:3001`). CORS allows
`WEB_ORIGIN` (default `http://localhost:5173`). All Prisma access server-side;
the service role bypasses RLS.

### Health
- `GET /health` → `{ status, service, time }`

### Catalog (read)
- `GET /clients` → clients + contracts + `_count.sites`
- `GET /sites?clientId=` → sites + client + assets + counts
- `GET /sites/:id` → site + client + assets + folders(+documents)
- `GET /engineers` → users where role=engineer & active, + engineer profile
- `GET /contacts?clientId=` → contacts + client + site

### Jobs & dispatch
- `GET /jobs?clientId=&siteId=&engineerId=&status=` → jobs + site + client + assignments(engineer) + jobAssets(asset)
- `GET /jobs/:id` → job detail (site, client, assignments, jobAssets, submissions)
- `PATCH /jobs/:id/status` body `{ status }` — **guarded by the state machine**.
  Completing/signing a PPM job sets its source rule's `lastCompletedDate`.
- `POST /jobs/:id/assign` body `{ engineerId, role? }` — upsert assignment
- `DELETE /jobs/:id/assign/:engineerId`

### Scheduling
- `POST /scheduling/materialize` → `{ rulesChecked, jobsCreated, jobsExisting, nextDueUpdated }`
- Nightly cron (`@nestjs/schedule`, 02:00) runs the same materializer.

### Forms & submissions
- `GET /form-templates` → active templates (incl. `schema`)
- `GET /submissions?jobId=` ; `GET /submissions/:id`
- `POST /submissions` body `{ jobId, formTemplateId, assetId?, engineerId? }` —
  creates a **draft**, snapshots `templateVersion` + `schemaSnapshot`
- `PATCH /submissions/:id/answers` body `{ answers }` — autosave (draft only)
- `POST /submissions/:id/complete` → validates against the snapshot; **missing
  required fields → 400** `{ message, missingRequired[] }`; success →
  `{ submission, warnings[] }` (out-of-band readings are warnings, not blockers)
- `POST /submissions/:id/sign` body `{ signerRole, signerName, signerEmail?, imageDataUrl? }`
  — stores the PNG to the `signatures` bucket, records a `Signature`
- `POST /submissions/:id/pdf` → renders the branded PDF (Playwright), stores in
  `reports` bucket, **auto-files** a linked `Document` into the site's
  "PPM Reports"/"Service Reports" folder (idempotent upsert), sets `pdfUrl`

### Files (local storage driver only)
- `GET /files/*` → streams a locally-stored object (Supabase issues its own URLs)

### Zoho (Phase 4 — specified)
- `GET /integrations/zoho/:service/connect` → OAuth authorize redirect (region-aware)
- `GET /integrations/zoho/callback` → exchange code, store encrypted tokens
- `POST /integrations/zoho/webhooks/:service` → inbound sync receiver
- `POST /integrations/zoho/reconcile` → delta reconciliation

---

## 6. Scheduling & Dispatch

**PPM materializer** (`PpmMaterializerService.run(now)`):
1. Load active `PpmFrequencyRule`s (+ asset → site → client → org).
2. `nextDue = computeNextDue(...)`; if it differs from stored `nextDueDate`, update it.
3. **Lead window = 60 days.** If `nextDue ≤ now + 60d`, materialize a `Job`
   (`jobType=ppm`, `sourcePpmRuleId`, `dueCycleDate = startOfDay(nextDue)`,
   `status=scheduled`) and link the asset via `JobAsset`.
4. Idempotency: DB unique `(sourcePpmRuleId, dueCycleDate)` — re-runs create 0.
5. On job completion/sign-off, the rule's `lastCompletedDate` is stamped so the
   next cycle materializes automatically.

**Dispatch state machine** (`assertTransition(from, to)`), allowed transitions:
```
scheduled   → dispatched | cancelled | on_hold
dispatched  → en_route | on_site | cancelled | on_hold
en_route    → on_site | cancelled | on_hold
on_site     → in_progress | cancelled | on_hold
in_progress → completed | on_hold | cancelled
completed   → signed_off | in_progress
signed_off  → invoiced
invoiced    → (terminal)
cancelled   → scheduled
on_hold     → scheduled | dispatched | en_route | on_site | in_progress
```
Illegal transitions return 400 with the allowed set. The web mirrors this map to
offer only valid "advance to" options; the API is the authority.

**Scheduling UI**: engineer × day board (Phase 0/2). FullCalendar resource-
timeline with drag-assign is the Phase 2.5 upgrade. Realtime board via Supabase
Realtime.

---

## 7. Forms Engine

- Templates are **data** (`FormSchema`), versioned. Submissions snapshot the
  schema + version so historical reports render exactly as filled.
- Lifecycle: create draft → autosave answers (debounced 600 ms, draft only) →
  complete (validate) → sign (drawn signature pad; or Zoho Sign in Phase 5) →
  generate PDF.
- **Validation** (`validateSubmission`): required fields missing → block;
  `reading` values outside `[min,max]` → warnings. `signature`/`attachment`
  field types are NEVER "missing required" (captured outside the answers map).
- **PDF**: `report-template.ts` builds branded HTML (navy header, KV tables per
  section, signature images inlined as data URLs); `PdfService` renders via
  Playwright Chromium (A4, printBackground). Output stored + auto-filed as a
  `Document` linked to the submission.

---

## 8. Storage

`StorageService` abstraction with two drivers:
- **local** (dev/CI): writes under `LOCAL_STORAGE_DIR` (default `./.storage`),
  served via `GET /files/*`.
- **supabase** (prod, when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set):
  uploads via Storage REST, returns signed URLs.

Buckets (private; created by `infra/supabase/storage.sql`):
`documents`, `reports` (PDF), `signatures` (PNG/JPEG), `photos`.

---

## 9. Zoho Integration (Phase 4–5 design)

- **OAuth2** authorization-code per service; tokens encrypted in
  `ZohoConnection`. **Region-aware** — persist `apiDomain` (`.com`/`.eu`/`.sa`;
  Riyadh → likely `.sa`). All calls go through a single `ZohoClient` wrapper:
  auto-refresh on 401, token-bucket throttle, exponential backoff on 429 —
  **never call Zoho from a request handler**; use the queue.
- **Mapping**: Client→CRM Account, Contact→CRM Contact, Contract→CRM Deal→Books
  Customer, Job→Zoho FSM Work Order (optional), Invoice→Books, Part→Inventory
  Item, sign-off→Zoho Sign.
- **Bidirectional sync** (headline: clients/contracts): inbound CRM webhooks →
  upsert + update `ZohoSyncMap`; outbound on local change → push + store Zoho ids.
  **Conflict policy**: field-level last-writer-wins by modified timestamp, with
  per-field source-of-truth overrides (billing → Books authoritative;
  operational → FSM). Unresolved conflicts surface in an admin **"Sync issues"**
  view; never silent-overwrite. Loop prevention via payload hash compare.
  Periodic **delta reconciliation** catches missed webhooks.
- **De-risking**: start inbound-only; enable outbound + conflict logic once the
  sync map/audit are proven.

---

## 10. Design System

Tailwind theme tokens (carry the original portal look):
```
navy #0d1b2e · navy2 #152540 · navy3 #1e3356
brand #185FA5 · brand.light #E6F1FB · brand.mid #378ADD · brand.dark #0C447C
accent #0ea5e9 · teal #0d9488 · ok #10b981 · warn #f59e0b · danger #ef4444 · purple #7c3aed
muted #64748b · line #e2e8f0 · bg #f1f5f9
font sans: 'IBM Plex Sans'; mono: 'IBM Plex Mono'; icons: Tabler
radius card 12px
```
Shell: sticky navy topbar (54px) + 225px navy sidebar nav + scrollable main.
Components: StatCard (accent top-border), card grids, breadcrumb folder browser,
contact tables, modals (navy header), bottom-right toasts, status pills, asset
badges. Views: Dashboard, Clients & Contracts, Sites & Assets (+ folder browser),
Schedule & Dispatch, PPM & Service Forms, Contacts, Zoho Integration. The web
data layer (TanStack Query) falls back to seed data when the API is offline and
shows a Live/Demo badge.

---

## 11. Seed Data

`packages/db/prisma/seed.ts` creates org **QEY Technical**, 5 engineers (Lee
Moore=ops_manager; Muhammad Shakeel, Evgenii, Andrei, Jon=engineer), the 6 form
templates, and two clients:
- **QST HVAC** (Riyadh) — contract "O&M — DMMA/DMMB"; sites DC1/DMMA (chiller
  MEP1-CH1, fan_wall DH1-09, crac IF1-02) and DC2/DMMB (chiller DMMB-CH1).
- **Fincantieri Qatar** (Doha) — fleet PPM contract; vessels Al Zubarah/F101
  (2 chillers) and Musherib/Q61 (1 chiller).
Each site gets the 9 standard folders; each asset gets a six_month PPM rule
(anchor 2026-01-15) mapped to the matching template.

Verified seed counts: 2 clients, 4 sites, 7 assets, 7 PPM rules, 36 folders,
6 templates.

---

## 12. Environment Variables

```
DATABASE_URL, DIRECT_URL                       # Postgres (Supabase session URL)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
API_PORT=3001, WEB_ORIGIN=http://localhost:5173
REDIS_URL                                       # Phase 4/5
TOKEN_ENCRYPTION_KEY                            # 32-byte base64 (Zoho tokens)
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.sa, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI
VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
CHROMIUM_PATH                                   # optional explicit Chromium for PdfService
LOCAL_STORAGE_DIR                               # local storage driver path
```
Note: set `DATABASE_URL` and `DIRECT_URL` as **separate** statements (don't
expand `$DATABASE_URL` in the same `export`).

---

## 13. Build, Setup & Run

```bash
pnpm install

# Database — one command: migrate → RLS → buckets → seed
cp .env.example .env          # set DATABASE_URL / DIRECT_URL
pnpm supabase:setup           # scripts/setup-supabase.sh (idempotent; --no-seed to skip)
# local stack alternative: pnpm supabase:start  (infra/supabase/config.toml)

pnpm db:generate              # prisma generate
pnpm --filter @fsm/shared build
pnpm dev:api                  # NestJS on :3001  (GET /health)
pnpm dev:web                  # Vite on :5173

pnpm -r typecheck             # all packages
pnpm --filter @fsm/web build  # production web build
```

`scripts/setup-supabase.sh` runs: generate + build shared → `prisma migrate
deploy` → apply `policies.sql` (RLS) → apply `storage.sql` (buckets) → seed.

### RLS (`infra/supabase/policies.sql`)
- `app.current_org_id()` reads the verified JWT `app_metadata.org_id` (returns
  **text** — Prisma ids are text). RLS enabled (deny-by-default) on all 23
  tenant tables; tenant-isolation policies on org-scoped tables
  (Organization, User, Client, Job, Part, ZohoConnection). Service role bypasses.
  Child tables are reached via the service-role API for now.

---

## 14. Phase Status

- **Phase 0/1 — foundation** ✅ monorepo, design system, full data model, Supabase
  setup script, document portal views, seed.
- **Phase 2 — scheduling & dispatch** ✅ catalog API, PPM materializer + cron,
  dispatch state machine, web board wired live (TanStack Query + fallback).
- **Phase 3 — forms persistence, PDF & sign-off** ✅ templates/submissions API,
  validation, drawn sign-off, Playwright PDF + auto-file, storage abstraction,
  live web forms flow.
- **Phase 4 — Zoho sync** ⏳ OAuth + ZohoClient + bidirectional clients/contracts
  sync (inbound-first) + conflict "Sync issues" view + reconciliation.
- **Phase 5 — billing, e-sign, inventory & polish** ⏳ Books invoices from
  signed-off jobs, Zoho Sign counter-signature, Inventory parts, SLA reporting,
  FullCalendar drag-assign, observability.

---

## 15. Verification Checklist (how to prove a rebuild works)

- **DB**: `prisma migrate deploy` + seed → 2 clients / 4 sites / 7 assets / 7 PPM
  rules / 36 folders / 6 templates. `policies.sql` & `storage.sql` apply
  idempotently (RLS on 23 tables, 6 tenant policies, 4 buckets).
- **Scheduling**: `POST /scheduling/materialize` creates 7 jobs, re-run creates 0;
  illegal `PATCH /jobs/:id/status` returns 400; completing a PPM stamps the rule.
- **Forms**: create submission → autosave → complete blocks on missing required,
  then succeeds flagging a 500 V reading outside 380–420 V; sign stores a PNG;
  `POST .../pdf` yields a valid multi-page PDF served at `/files/...` and
  auto-filed into "PPM Reports" (Document upsert stays 1 row on re-render);
  autosave blocked after completion.
- **Web**: `pnpm -r typecheck` clean; `pnpm --filter @fsm/web build` succeeds;
  Schedule shows "Live" when the API is reachable, "Demo data" otherwise.
- **Standalone**: `demo/FSM_Demo.html` opens with no server; all views navigate;
  form validation blocks then completes; printable PDF report opens.

---

## 16. Known Pitfalls (learned during build)

1. `pnpm --filter X deploy` collides with pnpm's built-in `deploy`; name the
   script `migrate:deploy`.
2. Prisma `String` ids map to **text** columns — RLS helper must return `text`,
   not `uuid`.
3. The Node API can't import `@fsm/shared`/`@fsm/db` as raw TS — compile shared
   to CJS `dist`; import Prisma from `@prisma/client`.
4. `tsconfig.base.json` has `declaration: true`; the API must override to
   `false` or Prisma return types trigger TS2742.
5. Set `DATABASE_URL`/`DIRECT_URL` in separate `export` statements.
6. The forms validator must skip `signature`/`attachment` types in the required
   check (captured outside `answers`).
7. CORS `WEB_ORIGIN` must match the actual web origin/port.
