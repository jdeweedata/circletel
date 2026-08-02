#!/usr/bin/env bash
# Run vendor SQLite staging → Supabase sync on the Coolify VPS host.
# Must run on the host (not via APP_URL curl) so SQLite persists under
# data/vendor-cache/ (or VENDOR_CACHE_DB_PATH).
#
# Usage: ops/scheduler/run-vendor-cache.sh ruijie|tarana|interstellio [extra flags…]
set -euo pipefail

VENDOR="${1:-}"
if [[ -z "$VENDOR" ]]; then
  echo "usage: $0 ruijie|tarana|interstellio [--dry-run|--publish-only|…]" >&2
  exit 2
fi
shift || true

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Load env: production secrets often live in .env / .env.production.local
# (Interstellio). Later files do not override already-set vars from earlier ones.
#
# Temporarily disable nounset: .env may contain self-references like
# DATABASE_URL=$DATABASE_URL which abort under `set -u` when unset.
set +u
set -a
for envfile in .env .env.production.local .env.local; do
  if [[ -f "$envfile" ]]; then
    # shellcheck disable=SC1090
    source "$envfile"
  fi
done
set +a
set -u

export VENDOR_CACHE_DB_PATH="${VENDOR_CACHE_DB_PATH:-$ROOT/data/vendor-cache/vendor-cache.db}"
mkdir -p "$(dirname "$VENDOR_CACHE_DB_PATH")"

TSX="$ROOT/node_modules/.bin/tsx"
if [[ ! -x "$TSX" ]]; then
  TSX="$(command -v npx)"
  exec "$TSX" --yes tsx --tsconfig tsconfig.json scripts/vendor-cache/sync.ts --vendor="$VENDOR" "$@"
fi

exec "$TSX" --tsconfig tsconfig.json scripts/vendor-cache/sync.ts --vendor="$VENDOR" "$@"
