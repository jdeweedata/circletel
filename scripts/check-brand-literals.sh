#!/usr/bin/env bash
# Brand-literal ratchet — whitelabel Phase 0 (spec §2).
# Counts hard-coded "circletel" occurrences in product code and fails
# if the count INCREASED vs the checked-in baseline. The count must only
# ever go down (target: 0 by Phase 4).
#
# Allowed home for brand literals: lib/tenant/ (the tenant's identity file).
set -euo pipefail
cd "$(dirname "$0")/.."

BASELINE_FILE=".brand-literal-baseline"

count=$(grep -ri "circletel" app components lib \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="tenant" \
  | wc -l | tr -d ' ')

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "ERROR: $BASELINE_FILE missing. Create it with: echo $count > $BASELINE_FILE"
  exit 1
fi
baseline=$(tr -d ' \n' < "$BASELINE_FILE")

echo "Brand literals: $count (baseline: $baseline)"

if (( count > baseline )); then
  echo "FAIL: brand-literal count increased ($baseline -> $count)."
  echo "New code must read identity from lib/tenant (getTenantConfig())."
  echo "See docs/architecture/TENANT_CONFIG.md"
  exit 1
fi

if (( count < baseline )); then
  echo "NOTE: count dropped below baseline — ratchet it down:"
  echo "  echo $count > $BASELINE_FILE   (and commit it)"
fi

echo "OK"
