#!/usr/bin/env bash
# Supplier sync cron script
# Runs the full sync orchestrator via npx tsx
set -euo pipefail

cd /home/circletel

# Load env
set -a
source .env.production.local 2>/dev/null || true
set +a

# Run sync
npx tsx scripts/sync-all-suppliers.ts 2>&1
