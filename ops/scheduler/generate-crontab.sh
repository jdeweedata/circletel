#!/usr/bin/env bash
# Generate the host crontab from vercel.json (single source of truth).
# Portable-scheduler requirement: whitelabel spec §12 — cron must not
# depend on any specific host; this file + /root/.cron-env (CRON_SECRET,
# APP_URL) is everything a host or tenant-bundle container needs.
#
# Usage: ops/scheduler/generate-crontab.sh > /tmp/crontab.new
#        crontab /tmp/crontab.new
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "# CircleTel platform cron jobs — GENERATED from vercel.json"
echo "# Regenerate: ops/scheduler/generate-crontab.sh | crontab -"
echo "# Requires /root/.cron-env exporting CRON_SECRET and APP_URL"
echo "# All times UTC. Logs: /var/log/circletel-cron.log"
echo "# curl: --connect-timeout 15 --max-time 360 (prevent multi-hour hung clients; longest route maxDuration=300s)"

# --max-time 360s: hard client cap so a stuck API cannot leave curl running for hours
# (incident 2026-07-31: zoho-sync hung ~23min). Slightly above vercel maxDuration 300s
# for generate-monthly-invoices. --connect-timeout fails fast on DNS/TCP hang.
# ---------------------------------------------------------------------------
# Read vercel.json from origin/main, not from the working tree.
# Production runs a container built from main, but this script is normally run
# in /home/circletel — a dev worktree. An uncommitted vercel.json edit there
# leaks straight into the live schedule: on 29/08/2026 a regenerate silently
# stopped new-signup-followup and pointed a 4-hourly job at a route that
# exists in no branch.
# Falls back to the working copy when there is no git checkout or no origin,
# so a tenant-bundle container still works (whitelabel spec 12).
# Override with CRON_REF=... for a tenant pinned to another branch.
# Every notice goes to stderr — stdout is the crontab.
# ---------------------------------------------------------------------------
CRON_REF="${CRON_REF:-origin/main}"
VERCEL_JSON="vercel.json"

if git rev-parse --git-dir >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  git fetch -q origin "${CRON_REF#origin/}" 2>/dev/null ||
    echo "WARNING: could not fetch ${CRON_REF#origin/} — $CRON_REF may be stale" >&2
  if git cat-file -e "$CRON_REF:vercel.json" 2>/dev/null; then
    VERCEL_JSON="$(mktemp)"
    trap 'rm -f "$VERCEL_JSON"' EXIT
    git show "$CRON_REF:vercel.json" > "$VERCEL_JSON"
    git diff --quiet "$CRON_REF" -- vercel.json 2>/dev/null ||
      echo "NOTE: working vercel.json differs from $CRON_REF — generated from $CRON_REF" >&2
  else
    echo "WARNING: $CRON_REF:vercel.json not readable — using working copy" >&2
  fi
else
  echo "NOTE: no git checkout with an origin — using working copy of vercel.json" >&2
fi

jq -r '.crons[] | "\(.schedule) . /root/.cron-env && curl -sf --connect-timeout 15 --max-time 360 -H \"Authorization: Bearer $CRON_SECRET\" \"$APP_URL\(.path)\" >> /var/log/circletel-cron.log 2>&1"' "$VERCEL_JSON"

# ---------------------------------------------------------------------------
# Vendor SQLite staging → Supabase (host-local; not via APP_URL)
# SQLite must live on the VPS filesystem — do not curl production for these.
# Logs: /var/log/circletel-vendor-cache.log
# ---------------------------------------------------------------------------
# ponytail: these still come from the local worktree — run-vendor-cache.sh needs
# node_modules/tsx, so it cannot be read from a bare git ref. Keep the worktree
# on main if that matters; a second installed checkout is the upgrade path.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RUN="$ROOT/ops/scheduler/run-vendor-cache.sh"
LOG="/var/log/circletel-vendor-cache.log"

echo "# Vendor SQLite staging (host-local tsx — see docs/architecture/CRON_SCHEDULE.md)"
echo "*/30 * * * * $RUN ruijie >> $LOG 2>&1"
echo "0 22 * * * $RUN tarana >> $LOG 2>&1"
echo "0 * * * * $RUN interstellio >> $LOG 2>&1"

# ---------------------------------------------------------------------------
# Business knowledge mirror (jdeweedata/circletel-knowledge)
# Read-only pull so agents coding on this host see the current CircleTel
# standards and documents. The cloud Claude project is master; the repo is a
# copy, refreshed manually from the Windows mirror. See LAST-SYNC.md there.
# Logs: /var/log/circletel-knowledge.log  (-q keeps normal output quiet, so
# only errors — e.g. an expired token — reach the log)
# ---------------------------------------------------------------------------
echo "# Business knowledge mirror — see /home/circletel-knowledge/README.md"
echo "0 5 * * * cd /home/circletel-knowledge && git pull -q >> /var/log/circletel-knowledge.log 2>&1"
