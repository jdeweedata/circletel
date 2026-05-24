#!/usr/bin/env bash
# Stock-only supplier sync (SCOOP, NOLOGY, MIRO — skips RECTRON which has no stock data)
set -euo pipefail

cd /home/circletel

# Load env
set -a
source .env.production.local 2>/dev/null || true
set +a

# Run stock-only sync
npx tsx scripts/sync-all-suppliers.ts --stock-only 2>&1
