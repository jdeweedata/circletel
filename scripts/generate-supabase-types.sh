#!/usr/bin/env bash
# Dump live Supabase schema types into lib/types/database.generated.ts.
# Requires: supabase CLI (devDependency) and SUPABASE_ACCESS_TOKEN or `supabase login`.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ID="${SUPABASE_PROJECT_ID:-agyjovdugmtopasyvlng}"
OUT="lib/types/database.generated.ts"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "Generating types from project ${PROJECT_ID}..."
npx --no-install supabase gen types typescript --project-id "$PROJECT_ID" > "$TMP"

if ! grep -q "customer_invoices" "$TMP"; then
  echo "FAIL: generated output is missing customer_invoices — not writing ${OUT}"
  exit 1
fi

{
  cat <<'EOF'
/**
 * AUTO-GENERATED from live Supabase project agyjovdugmtopasyvlng.
 * Do not edit by hand. Regenerate with: npm run types:generate
 *
 * Public re-export: lib/types/database.types.ts
 */
EOF
  cat "$TMP"
} > "$OUT"

echo "Wrote ${OUT} ($(wc -l < "$OUT") lines)"
bash scripts/check-generated-types.sh
