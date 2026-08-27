#!/usr/bin/env bash
# Unit tests for pin_compose_image (sourced; does not recreate prod).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=../../scripts/recreate-circletel-prod.sh
source "$ROOT/scripts/recreate-circletel-prod.sh"

fail() { echo "FAIL: $*" >&2; exit 1; }

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

cat > "$tmp" <<'YAML'
services:
    b7ukn3c76rd46dsl19oqq59e-043449303664:
        image: 'ghcr.io/jdeweedata/circletel:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
YAML

new_sha='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
pin_compose_image "$tmp" "$new_sha" || fail "pin_compose_image exited non-zero"
grep -q "ghcr.io/jdeweedata/circletel:${new_sha}" "$tmp" || fail "new SHA not written"
if grep -q 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' "$tmp"; then
  fail "old SHA still present"
fi

if pin_compose_image "$tmp" "not-a-sha" 2>/dev/null; then
  fail "invalid SHA should be rejected"
fi

echo "pin_compose_image tests passed"
