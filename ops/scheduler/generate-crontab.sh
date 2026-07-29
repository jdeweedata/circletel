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

jq -r '.crons[] | "\(.schedule)\t. /root/.cron-env && curl -sfH \"Authorization: Bearer $CRON_SECRET\" $APP_URL\(.path) >> /var/log/circletel-cron.log 2>&1"' vercel.json
