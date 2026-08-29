#!/usr/bin/env bash
# Reproduces the 29/08/2026 cron incident and asserts generate-crontab.sh
# resists it. Zero-arg: run ops/scheduler/test-generate-crontab.sh
# Requires jq (as the generator does).
set -euo pipefail
GEN="$(cd "$(dirname "$0")" && pwd)/generate-crontab.sh"
command -v jq >/dev/null || { echo "SKIP: jq not installed"; exit 0; }
T="$(mktemp -d)"; cd "$T"
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
fail=0
chk(){ if [ "$2" = "$3" ]; then echo "  PASS  $1"; else echo "  FAIL  $1 (want $3, got $2)"; fail=1; fi; }

# --- "production" repo: main has new-signup-followup ---
mkdir up && cd up && git init -qb main
mkdir -p ops/scheduler && cp "$GEN" ops/scheduler/generate-crontab.sh && chmod +x ops/scheduler/generate-crontab.sh
echo '{"crons":[{"schedule":"30 6 * * *","path":"/api/cron/new-signup-followup"}]}' > vercel.json
git add -A && git commit -qm main
cd ..

# --- dev worktree: feature branch, dirty vercel.json (the incident) ---
git clone -q up dev && cd dev && git checkout -qb feat/x
echo '{"crons":[{"schedule":"0 */4 * * *","path":"/api/cron/sales-followup"}]}' > vercel.json

echo "TEST 1 — dirty feature worktree must still generate production's schedule"
OUT="$(ops/scheduler/generate-crontab.sh 2>/dev/null)"
chk "keeps new-signup-followup" "$(echo "$OUT" | grep -c new-signup-followup)" "1"
chk "drops phantom sales-followup" "$(echo "$OUT" | grep -c sales-followup || true)" "0"

echo "TEST 2 — operator is warned on stderr, and stdout stays clean cron"
ERR="$(ops/scheduler/generate-crontab.sh 2>&1 >/dev/null)"
chk "warns about the drift" "$(echo "$ERR" | grep -c 'differs from')" "1"
chk "no warning text on stdout" "$(echo "$OUT" | grep -c 'NOTE:\|WARNING:' || true)" "0"

echo "TEST 3 — committed change on main IS picked up (not just frozen)"
cd ../up && echo '{"crons":[{"schedule":"0 9 * * *","path":"/api/cron/brand-new"}]}' > vercel.json
git commit -qam add-new && cd ../dev
chk "sees new committed job" "$(ops/scheduler/generate-crontab.sh 2>/dev/null | grep -c brand-new)" "1"

echo "TEST 4 — no git / no origin (tenant container) falls back to working copy"
mkdir -p ../bare/ops/scheduler && cp "$GEN" ../bare/ops/scheduler/generate-crontab.sh
chmod +x ../bare/ops/scheduler/generate-crontab.sh
echo '{"crons":[{"schedule":"0 1 * * *","path":"/api/cron/tenant-job"}]}' > ../bare/vercel.json
cd ../bare
chk "uses local vercel.json" "$(ops/scheduler/generate-crontab.sh 2>/dev/null | grep -c tenant-job)" "1"

echo; [ $fail -eq 0 ] && echo "ALL PASS" || { echo "FAILURES"; exit 1; }
