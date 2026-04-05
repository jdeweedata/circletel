# CircleTel CI/CD Workflows

CircleTel runs on **Coolify** (self-hosted, VPS 30 — 94.72.104.81, 24GB RAM).
Builds run on a self-hosted GitHub Actions runner on that VPS; deploys are triggered via Coolify webhook.

Migration completed: 2026-04-05. See `docs/architecture/COOLIFY_MIGRATION_PLAN.md`.

---

## Pipeline Overview

```
PR opened/updated
  └─ staging-deployment.yml  → push to staging branch → Coolify staging deploy
  └─ pr-checks.yml           → Dockerfile validation, type-check, lint, build

PR approved + 'automerge' label added
  └─ auto-merge.yml          → squash merge to main

Push to main
  └─ deploy.yml              → build Docker image → push GHCR → trigger Coolify webhook

Scheduled (every 6h)
  └─ mtn-session.yml         → validate MTN session; refresh + redeploy if stale
```

---

## Workflows

### `deploy.yml` — Build & Deploy to Production

**Trigger**: Push to `main`

**Runner**: `self-hosted` (VPS 30 — 24GB RAM; GitHub-hosted ubuntu-latest OOMs on this 254-page app)

**Steps**:
1. Build Docker image with `NEXT_PUBLIC_*` secrets baked in as build args
2. Push to `ghcr.io/jdeweedata/circletel:latest`
3. Trigger Coolify deploy webhook → Coolify pulls the new image and restarts the container

**Cache**: Local disk cache on VPS (`/tmp/buildx-cache`) — no network round-trip

---

### `pr-checks.yml` — Quality Checks

**Trigger**: PRs to `main`, pushes to `main`

**Jobs**:
- `validate-dockerfile` — checks `NODE_OPTIONS` heap ≥8192MB and `output: 'standalone'` in next.config.js
- `type-check` — `npm run type-check` (non-blocking)
- `lint` — `npm run lint` (non-blocking)
- `build` — `npm run build:ci` (non-blocking, requires Supabase secrets)

---

### `auto-merge.yml` — Auto-Merge Approved PRs

**Trigger**: PR review submitted (approved) or check suite completed

**Behaviour**: Only merges PRs that have the **`automerge`** label. PRs without the label are silently skipped (not a failure).

**Method**: Squash merge

To enable auto-merge on a PR: add the `automerge` label before or after approval.

---

### `staging-deployment.yml` — Auto Deploy to Staging

**Trigger**: PR opened/updated targeting `main`

**Steps**: Force-pushes the PR branch to `staging` → Coolify picks up the push and deploys to the staging environment.

---

### `mtn-session.yml` — MTN Session Management

**Trigger**: Every 6 hours (scheduled), or manually via `workflow_dispatch`

**Steps**:
1. Validate current MTN session cookie is still active
2. If valid: done
3. If expired: run 2Captcha-based refresh on `self-hosted` runner, update `MTN_SESSION` env var in Coolify via API, restart container

**Dedup**: Only opens a GitHub issue if no open `mtn-session` issue already exists.

---

### `claude-code-review.yml` / `claude.yml` — AI Code Review

Automated code review and interactive Claude assistance on PRs and issues.

---

### `api-integration-tests.yml` / `test-payment-integration.yml` — Integration Tests

Payment webhook and API integration tests. Run on PRs touching relevant paths.

---

## Secrets Reference

| Secret | Used By | Purpose |
|--------|---------|---------|
| `COOLIFY_DEPLOY_WEBHOOK` | `deploy.yml` | Trigger Coolify production deploy |
| `COOLIFY_API_TOKEN` | `mtn-session.yml` | Update env vars + restart app via Coolify API |
| `COOLIFY_APP_UUID` | `mtn-session.yml` | Coolify application identifier (`b7ukn3c76rd46dsl19oqq59e`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `deploy.yml`, `pr-checks.yml` | Build-time Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `deploy.yml` | Build-time Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `deploy.yml` | Build-time Maps key |
| `NEXT_PUBLIC_NETCASH_SERVICE_KEY` | `deploy.yml` | Build-time NetCash key |
| `NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY` | `deploy.yml` | Build-time NetCash PCI key |
| `MTN_SESSION` | `mtn-session.yml` | Current MTN session cookie (refreshed automatically) |
| `TWO_CAPTCHA_API_KEY` | `mtn-session.yml` | 2Captcha key for session refresh |

> **Note**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` are no longer used and can be deleted from repository secrets.

---

## Production URLs

| Environment | URL |
|-------------|-----|
| Production | https://www.circletel.co.za |
| Staging | Triggered by pushing to `staging` branch |
| Health check | https://www.circletel.co.za/api/health |

---

## Manual Overrides

```bash
# Force a production deploy without a code change
gh workflow run deploy.yml

# Manually refresh MTN session
gh workflow run mtn-session.yml

# Push a branch to staging manually
git push origin <branch>:staging --force

# Trigger deploy via Coolify webhook directly
curl -sfX GET "$COOLIFY_DEPLOY_WEBHOOK" -H "Authorization: Bearer $COOLIFY_API_TOKEN"
```
