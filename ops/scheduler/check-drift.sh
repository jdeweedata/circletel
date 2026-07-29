#!/usr/bin/env bash
# Compare the LIVE crontab's /api/cron entries against vercel.json.
# Exit 1 on drift. Run after any change to vercel.json crons.
set -euo pipefail
cd "$(dirname "$0")/../.."

expected=$(jq -r '.crons[] | "\(.schedule) \(.path)"' vercel.json | sort)
actual=$(crontab -l 2>/dev/null \
  | grep -o '^[^.]*\. /root/.cron-env.*api/cron/[a-z0-9-]*' \
  | sed -E 's|^([^[:space:]]+ [^[:space:]]+ [^[:space:]]+ [^[:space:]]+ [^[:space:]]+)[[:space:]]+.*(/api/cron/[a-z0-9-]+).*|\1 \2|' \
  | sort)

if [[ "$expected" == "$actual" ]]; then
  echo "OK: live crontab matches vercel.json ($(echo "$expected" | wc -l | tr -d ' ') crons)"
  exit 0
fi

echo "DRIFT between vercel.json and live crontab:"
diff <(echo "$expected") <(echo "$actual") || true
echo "Fix: ops/scheduler/generate-crontab.sh | crontab -"
exit 1
