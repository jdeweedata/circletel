#!/usr/bin/env bash
# Recreate the Coolify CircleTel production container without pulling GHCR.
#
# Coolify UI/API Restart for build_pack=dockerimage runs `docker compose pull`
# then `up --build`. GHCR :latest is not kept in sync (the GHA runner IS this
# VPS), so that path can boot the May 2026 image and 502 Traefik if emergency
# routes still pin an old container suffix.
#
# Usage:
#   scripts/recreate-circletel-prod.sh
#   EXPECTED_SHA=<40-char git sha> scripts/recreate-circletel-prod.sh
#
# Env-only changes: PATCH Coolify env (or edit the app .env), then this script.
# Never click Restart in Coolify for this app.

set -euo pipefail

PROD_LABEL='coolify.name=b7ukn3c76rd46dsl19oqq59e'
COMPOSE_DIR="${COMPOSE_DIR:-/data/coolify/applications/b7ukn3c76rd46dsl19oqq59e}"
EMERGENCY_YAML="${EMERGENCY_YAML:-/data/coolify/proxy/dynamic/emergency-apps.yaml}"
HEALTH_TIMEOUT_S="${HEALTH_TIMEOUT_S:-200}"

assert_no_prod_emergency_hosts() {
  if [[ ! -f "$EMERGENCY_YAML" ]]; then
    echo "WARN: $EMERGENCY_YAML missing — Traefik file provider may have moved."
    return 0
  fi
  if grep -E 'emergency-circletel' "$EMERGENCY_YAML" >/dev/null 2>&1; then
    echo "ERROR: $EMERGENCY_YAML still has emergency-circletel routes."
    echo "Those Host rules beat Coolify docker labels and 502 after a suffix change."
    echo "Keep prod on Traefik labels. Staging/CMS emergency routes only."
    exit 1
  fi
  if grep -E 'Host\(`(www\.)?circletel\.co\.za`\)|Host\(`studio\.circletel\.co\.za`\)|Host\(`sanity\.circletel\.co\.za`\)' "$EMERGENCY_YAML" >/dev/null 2>&1; then
    echo "ERROR: $EMERGENCY_YAML pins production CircleTel hosts."
    echo "Do not add circletel.co.za / www / studio / sanity back to this file."
    exit 1
  fi
}

wait_healthy() {
  local container="$1"
  local i status
  local steps=$((HEALTH_TIMEOUT_S / 5))
  echo "Waiting for health check on $container..."
  for i in $(seq 1 "$steps"); do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo 'not found')
    echo "$(date +%H:%M:%S) — $status"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    sleep 5
  done
  echo "ERROR: Container did not become healthy within ${HEALTH_TIMEOUT_S}s"
  docker logs --tail 50 "$container" || true
  exit 1
}

verify_commit_sha() {
  local container="$1"
  local actual
  actual=$(docker exec "$container" cat /app/COMMIT_SHA.txt 2>/dev/null || echo 'MISSING')
  actual=$(printf '%s' "$actual" | tr -d '[:space:]')
  echo "COMMIT_SHA=$actual"
  if [[ "$actual" == "MISSING" || -z "$actual" || "$actual" == "HEAD" ]]; then
    echo "ERROR: Image has no git COMMIT_SHA.txt — this is the stale GHCR :latest failure mode."
    echo "Retag the last GHA SHA as ghcr.io/jdeweedata/circletel:latest, then re-run this script."
    exit 1
  fi
  if [[ ! "$actual" =~ ^[0-9a-f]{40}$ ]]; then
    echo "ERROR: COMMIT_SHA.txt is not a 40-char git sha: $actual"
    exit 1
  fi
  if [[ -n "${EXPECTED_SHA:-}" ]]; then
    if [[ "$actual" != "$EXPECTED_SHA" ]]; then
      echo "ERROR: Container commit $actual does not match EXPECTED_SHA $EXPECTED_SHA"
      exit 1
    fi
    echo "Image commit matches EXPECTED_SHA"
  fi
}

assert_no_prod_emergency_hosts

if [[ ! -d "$COMPOSE_DIR" ]]; then
  echo "ERROR: Coolify compose dir not found: $COMPOSE_DIR"
  exit 1
fi

echo "Recreating CircleTel prod with --no-build --pull never"
cd "$COMPOSE_DIR"
docker compose up -d --force-recreate --no-build --pull never

CONTAINER=$(docker ps --filter "label=$PROD_LABEL" --format '{{.Names}}' | head -1)
if [[ -z "$CONTAINER" ]]; then
  echo "ERROR: No running container with label $PROD_LABEL"
  docker ps -a --filter 'label=coolify.managed=true' --format '{{.Names}} {{.Status}}'
  exit 1
fi
echo "Found container: $CONTAINER"

wait_healthy "$CONTAINER"
verify_commit_sha "$CONTAINER"

echo "HTTPS health:"
curl -sS -m 15 -o /tmp/circletel-prod-health.json -w 'http_code=%{http_code}\n' https://www.circletel.co.za/api/health || true
head -c 240 /tmp/circletel-prod-health.json; echo
echo "Recreate complete."
