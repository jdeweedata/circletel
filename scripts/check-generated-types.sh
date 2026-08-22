#!/usr/bin/env bash
# Fail if generated Supabase types are missing, still a placeholder, or lack SoR tables.
set -euo pipefail
cd "$(dirname "$0")/.."

GENERATED="lib/types/database.generated.ts"
PUBLIC="lib/types/database.types.ts"

fail() {
  echo "FAIL: $1"
  echo "Fix: npm run types:generate   (see .claude/rules/data-model.md)"
  exit 1
}

[[ -f "$GENERATED" ]] || fail "${GENERATED} is missing"
[[ -f "$PUBLIC" ]] || fail "${PUBLIC} is missing"

grep -q "AUTO-GENERATED" "$GENERATED" || fail "${GENERATED} is missing the AUTO-GENERATED header"
grep -q "Until proper types are generated" "$PUBLIC" && fail "${PUBLIC} is still the placeholder"
grep -q "\[key: string\]: {" "$PUBLIC" && fail "${PUBLIC} still uses a catch-all table index"
grep -q "database.generated" "$PUBLIC" || fail "${PUBLIC} must re-export from database.generated.ts"

for table in customer_invoices customers consumer_orders service_packages products; do
  grep -q "${table}:" "$GENERATED" || fail "${GENERATED} is missing table ${table}"
done

echo "OK: generated types present (${GENERATED}, $(wc -l < "$GENERATED") lines) and ${PUBLIC} re-exports them"
