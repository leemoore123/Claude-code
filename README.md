# FSM Platform

Field Service Management for a multi-client HVAC operation — client/contract
management, an asset hierarchy (Clients → Sites/Vessels → Assets), recurring PPM
scheduling with engineer dispatch, a data-driven PPM/service forms engine, and
bidirectional Zoho sync (CRM / Books / Sign / Inventory).

Built from two existing client document portals (QST data centres, Fincantieri
fleet) — their visual language (navy/blue, IBM Plex, Tabler icons, card grids,
folder browser) is preserved in the web design system.

## Monorepo layout

```
apps/
  web/    React + Vite + TS + Tailwind — UI & design system
  api/    NestJS — scheduling, forms, Zoho OAuth/sync, PDF (workers)
packages/
  db/      Prisma schema + migrations + seed (the data model)
  shared/  shared types, domain helpers, and ALL form-template definitions
infra/     deploy config (later phases)
docs/      architecture notes
```

## Status

**Phase 0 / 1 — foundation** ✅
- Monorepo + design system reproducing the portal look
- Full Prisma data model (`packages/db/prisma/schema.prisma`) + Supabase setup script
- Data-driven PPM/service form definitions rendered by a working form renderer
- Web views: Dashboard, Clients & Contracts, Sites & Assets (folder browser),
  Schedule & Dispatch, PPM & Service Forms, Contacts, Zoho Integration

**Phase 2 — scheduling & dispatch** ✅
- Prisma-backed REST API: `/clients`, `/sites`, `/engineers`, `/contacts`, `/jobs`
- **PPM materializer** (`POST /scheduling/materialize` + nightly cron) — turns
  6M/1Y/3Y frequency rules into jobs inside a 60-day lead window, idempotent on
  `(sourcePpmRuleId, dueCycleDate)`; completing a PPM stamps the rule so the next
  cycle re-materialises
- **Dispatch state machine** — guarded `PATCH /jobs/:id/status` transitions +
  engineer assignment endpoints
- Web Schedule board wired to the live API (TanStack Query) with status-advance
  controls, a "Run materializer" action, and transparent fallback to seed data
  when the API is offline

**Phases 3–5 — forms persistence, Zoho sync, billing/e-sign** ⏳

See the full plan in `docs/` and the approved implementation plan.

## Develop

```bash
pnpm install

# Web (runs standalone on seed/mock data — no backend needed)
pnpm dev:web        # http://localhost:5173

# Database — one-command Supabase bring-up (migrate → RLS → buckets → seed)
cp .env.example .env   # set DATABASE_URL / DIRECT_URL
pnpm supabase:setup    # see docs/supabase-setup.md

# API (needs DATABASE_URL etc.)
pnpm dev:api           # http://localhost:3001/health
```

See **`docs/supabase-setup.md`** for hosted vs. local-stack options.

The web app is intentionally runnable without the backend during Phase 0/1 so the
UI can be reviewed immediately; data calls are swapped to the API in Phase 1+.
