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
jq -r '.crons[] | "\(.schedule) . /root/.cron-env && curl -sf --connect-timeout 15 --max-time 360 -H \"Authorization: Bearer $CRON_SECRET\" \"$APP_URL\(.path)\" >> /var/log/circletel-cron.log 2>&1"' vercel.json
