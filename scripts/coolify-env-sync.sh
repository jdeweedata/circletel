#!/bin/bash
# Coolify Environment Variable Sync
# Reads your .env file and bulk-imports into Coolify via API
#
# Usage:
#   COOLIFY_TOKEN=<api-token> COOLIFY_APP_UUID=<uuid> bash scripts/coolify-env-sync.sh
#
# Or with a specific env file:
#   COOLIFY_TOKEN=<api-token> COOLIFY_APP_UUID=<uuid> ENV_FILE=.env.production bash scripts/coolify-env-sync.sh
#
# To get your app UUID, run:
#   curl -s http://localhost:8000/api/v1/applications \
#     -H "Authorization: Bearer $COOLIFY_TOKEN" | python3 -m json.tool | grep '"uuid"' | head -1

set -e

COOLIFY_HOST="${COOLIFY_HOST:-http://localhost:8000}"
COOLIFY_TOKEN="${COOLIFY_TOKEN:?ERROR: Set COOLIFY_TOKEN}"
COOLIFY_APP_UUID="${COOLIFY_APP_UUID:?ERROR: Set COOLIFY_APP_UUID}"
ENV_FILE="${ENV_FILE:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

echo "Syncing env vars from $ENV_FILE to Coolify app $COOLIFY_APP_UUID..."
echo ""

SUCCESS=0
FAILED=0
SKIPPED=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && { ((SKIPPED++)); continue; }
  [[ -z "${line// }" ]] && continue

  # Must contain = to be a valid env var
  [[ "$line" != *"="* ]] && { ((SKIPPED++)); continue; }

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip if key is empty or contains spaces
  [[ -z "$KEY" || "$KEY" == *" "* ]] && { ((SKIPPED++)); continue; }

  # Escape value for JSON (handle quotes, newlines, backslashes)
  JSON_VALUE=$(printf '%s' "$VALUE" | python3 -c "
import sys, json
val = sys.stdin.read()
print(json.dumps(val)[1:-1])  # Remove surrounding quotes from json.dumps
")

  HTTP_CODE=$(curl -s -o /tmp/coolify-env-response.json -w "%{http_code}" \
    -X POST "$COOLIFY_HOST/api/v1/applications/$COOLIFY_APP_UUID/envs" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$KEY\", \"value\": \"$JSON_VALUE\", \"is_preview\": false, \"is_build_time\": false}")

  if [[ "$HTTP_CODE" == "201" || "$HTTP_CODE" == "200" ]]; then
    echo "  ✓ $KEY"
    ((SUCCESS++))
  else
    echo "  ✗ $KEY (HTTP $HTTP_CODE: $(cat /tmp/coolify-env-response.json 2>/dev/null))"
    ((FAILED++))
  fi

done < "$ENV_FILE"

echo ""
echo "Done: $SUCCESS synced, $FAILED failed, $SKIPPED skipped"

if [[ $FAILED -gt 0 ]]; then
  echo "Re-run to retry failed vars, or add them manually in the Coolify UI"
  exit 1
fi
