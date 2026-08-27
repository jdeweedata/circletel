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
# When EXPECTED_SHA is set, this script pins compose `image:` to
# ghcr.io/jdeweedata/circletel:<sha> BEFORE `up`. GHA tags that image
# locally; Coolify's compose file otherwise keeps the previous SHA and
# `--pull never` boots the old container (healthy, wrong COMMIT_SHA).
#
# Env-only changes: PATCH Coolify env (or edit the app .env), then this script
# without EXPECTED_SHA.
# Never click Restart in Coolify for this app.

set -euo pipefail

PROD_LABEL='coolify.name=b7ukn3c76rd46dsl19oqq59e'
COMPOSE_DIR="${COMPOSE_DIR:-/data/coolify/applications/b7ukn3c76rd46dsl19oqq59e}"
EMERGENCY_YAML="${EMERGENCY_YAML:-/data/coolify/proxy/dynamic/emergency-apps.yaml}"
HEALTH_TIMEOUT_S="${HEALTH_TIMEOUT_S:-200}"
IMAGE_REPO="${IMAGE_REPO:-ghcr.io/jdeweedata/circletel}"

pin_compose_image() {
  local file="$1"
  local sha="$2"
  local repo="${3:-$IMAGE_REPO}"
  if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "ERROR: EXPECTED_SHA must be a 40-char git sha, got: $sha" >&2
    return 1
  fi
  if [[ ! -f "$file" ]]; then
    echo "ERROR: compose file not found: $file" >&2
    return 1
  fi
  python3 - "$file" "$sha" "$repo" <<'PY'
import re
import sys
from pathlib import Path

path, sha, repo = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
text = path.read_text()
pattern = re.compile(re.escape(repo) + r":[A-Za-z0-9._-]+")
new, count = pattern.subn(f"{repo}:{sha}", text)
if count == 0:
    sys.stderr.write(f"ERROR: no {repo}:<tag> image line in {path}\n")
    sys.exit(1)
if new != text:
    path.write_text(new)
print(f"pinned compose image to {repo}:{sha} ({count} replacement(s))")
PY
}

find_compose_file() {
  local dir="$1"
  if [[ -n "${COMPOSE_FILE:-}" && -f "$COMPOSE_FILE" ]]; then
    printf '%s\n' "$COMPOSE_FILE"
    return 0
  fi
  local name
  for name in docker-compose.yaml docker-compose.yml compose.yaml compose.yml; do
    if [[ -f "$dir/$name" ]]; then
      printf '%s\n' "$dir/$name"
      return 0
    fi
  done
  echo "ERROR: no compose file in $dir" >&2
  return 1
}

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

recreate_prod() {
  assert_no_prod_emergency_hosts

  if [[ ! -d "$COMPOSE_DIR" ]]; then
    echo "ERROR: Coolify compose dir not found: $COMPOSE_DIR"
    exit 1
  fi

  if [[ -n "${EXPECTED_SHA:-}" ]]; then
    local compose_file
    compose_file="$(find_compose_file "$COMPOSE_DIR")"
    if ! docker image inspect "${IMAGE_REPO}:${EXPECTED_SHA}" >/dev/null 2>&1; then
      echo "ERROR: local image ${IMAGE_REPO}:${EXPECTED_SHA} not found."
      echo "GHA must finish 'Build Docker image' first. Do not up the previous compose tag."
      exit 1
    fi
    pin_compose_image "$compose_file" "$EXPECTED_SHA"
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
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  recreate_prod
fi
