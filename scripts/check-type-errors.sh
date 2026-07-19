#!/usr/bin/env bash
# TypeScript error ratchet — optimization audit H6 Phase 1.
# Counts `tsc --noEmit` errors and fails if the count INCREASED vs the
# checked-in baseline. The count must only ever go down (target: 0, at
# which point next.config.js ignoreBuildErrors can be flipped off).
#
# Same pattern as scripts/check-brand-literals.sh (brand-literal ratchet).
set -euo pipefail
cd "$(dirname "$0")/.."

BASELINE_FILE=".type-error-baseline"

# tsc exits non-zero when type errors exist (observed: exit 2 in this repo) —
# that's the normal case and we count the diagnostics. What must NEVER pass as
# "0 errors" is an aborted compiler: a signal exit (>=128, e.g. 137 OOM-kill)
# or a non-zero exit with no diagnostics at all.
set +e
tsc_output=$(NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit 2>&1)
tsc_status=$?
set -e

count=$(printf '%s\n' "$tsc_output" | grep -c "error TS" || true)

if (( tsc_status >= 128 )) || { (( tsc_status != 0 )) && (( count == 0 )); }; then
  echo "FAIL: tsc did not complete normally (exit $tsc_status, $count diagnostics)."
  printf '%s\n' "$tsc_output" | tail -20
  exit 1
fi

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "ERROR: $BASELINE_FILE missing. Create it with: echo $count > $BASELINE_FILE"
  exit 1
fi
baseline=$(tr -d ' \n' < "$BASELINE_FILE")

echo "TypeScript errors: $count (baseline: $baseline)"

if (( count > baseline )); then
  echo "FAIL: type-error count increased ($baseline -> $count)."
  echo "Fix the new errors in the files you touched — run: npm run type-check"
  echo "Pre-existing errors in untouched files are covered by the baseline."
  exit 1
fi

if (( count < baseline )); then
  echo "NOTE: count dropped below baseline — ratchet it down:"
  echo "  echo $count > $BASELINE_FILE   (and commit it)"
fi

echo "OK"
