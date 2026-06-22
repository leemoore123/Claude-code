#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-command Supabase bring-up for the FSM platform.
#
#   1. loads .env
#   2. runs Prisma migrations (creates all tables)             [DATABASE_URL]
#   3. applies RLS + tenant-isolation policies                  [infra/supabase/policies.sql]
#   4. provisions Storage buckets + their policies              [infra/supabase/storage.sql]
#   5. seeds the QST + Fincantieri demo data                    [packages/db/prisma/seed.ts]
#
# Works against EITHER:
#   • a hosted Supabase project — set DATABASE_URL / DIRECT_URL to its Postgres
#     connection string (use the "session" pooler or direct 5432 URL), or
#   • the local CLI stack — run `pnpm supabase:start` first, which exports the
#     local DATABASE_URL for you.
#
# Usage:
#   cp .env.example .env   # fill in DATABASE_URL (+ DIRECT_URL)
#   ./scripts/setup-supabase.sh            # full setup
#   ./scripts/setup-supabase.sh --no-seed  # skip the demo seed
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SEED=1
for arg in "$@"; do
  case "$arg" in
    --no-seed) SEED=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

# 1. Load .env if present
if [[ -f .env ]]; then
  set -a; # shellcheck disable=SC1091
  source .env; set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "✗ DATABASE_URL is not set. Copy .env.example → .env and set it (or run pnpm supabase:start)." >&2
  exit 1
fi
# Prisma needs DIRECT_URL too; default it to DATABASE_URL when unset.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# psql connection target (migrations use Prisma; raw SQL uses psql)
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1)

echo "▸ 1/5  Generating Prisma client + building shared package…"
pnpm --filter @fsm/db generate >/dev/null
pnpm --filter @fsm/shared build >/dev/null

echo "▸ 2/5  Applying database migrations…"
pnpm --filter @fsm/db migrate:deploy

echo "▸ 3/5  Applying RLS + tenant-isolation policies…"
"${PSQL[@]}" -f infra/supabase/policies.sql >/dev/null
echo "       RLS enabled on all tenant tables."

echo "▸ 4/5  Provisioning Storage buckets…"
"${PSQL[@]}" -f infra/supabase/storage.sql >/dev/null
echo "       Buckets: documents, reports, signatures, photos."

if [[ "$SEED" == "1" ]]; then
  echo "▸ 5/5  Seeding QST + Fincantieri demo data…"
  pnpm --filter @fsm/db seed
else
  echo "▸ 5/5  Skipping seed (--no-seed)."
fi

echo "✓ Supabase setup complete."
