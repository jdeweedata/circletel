# Self-Hosted Runner VPS Disk Management

**Trigger**: A `Build & Deploy` (prod or staging) fails the disk guard; "deploy failed but build looks fine"; VPS `/` near full
**Scope**: The self-hosted GitHub Actions runner that builds ON the prod VPS (94.72.104.81)
**Source**: 2+ incidents — 2026-06-09 (staging deploy disk-full), 2026-06-10 (staging Turbopack build failed 4GB guard)

---

## Why this recurs

The runner **is** the prod VPS, and every `deploy.yml` / `deploy-staging.yml` run does a local
`docker build` (the prod build uses `--no-cache`). Back-to-back builds on the same day pile up
unused images + build cache and fill `/` (96 GB disk). When free space drops below 4 GB, the
workflow's `Check disk space and cleanup` step hits:

```
::error::FATAL: Only <N>MB disk space available — need at least 4GB for build
```

…and **every later step (build, docker, deploy, health) is `skipped`**. So a "failed deploy"
whose `Build Next.js` step shows `skipped` is almost always THIS, not a build/code problem.

## Root cause of the weak auto-cleanup

The workflow cleanup used `docker image prune -f` + `docker builder prune -f` — these only remove
**dangling** images/cache and reclaim almost nothing (~0–361 MB observed). Fixed 2026-06-10 (PR #540)
to use `-a`. If you see the old `-f`-only form, that's the bug.

## DO

```bash
# Diagnose
df -h /                      # is / >90%? guard fails <4GB free
gh run view <id> --json jobs --jq '.jobs[].steps[]|"\(.conclusion) \(.name)"'  # "skipped" build = disk

# Fix — reclaims GBs; RUNNING CONTAINERS ARE SAFE (prod/staging/CMS/Coolify untouched)
docker builder prune -a -f   # full build cache
docker image prune -a -f     # ALL unused images (not just dangling)
df -h /                      # confirm >4GB (ideally >8GB) free

# Then re-trigger the failed run
gh run rerun <run-id>
```

Reclaim seen 2026-06-10: ~4.7 GB (3.6 → 9.3 GB free; 97% → 91%).

## DON'T

- Don't assume a `skipped` Build Next.js step is a build/Turbopack/code failure — check disk first.
- Don't use `prune -f` (dangling-only) when disk is full — it reclaims almost nothing.
- Don't fear `prune -a` will kill prod — images in use by a **running** container are never removed.
- Don't `docker system prune --volumes` blindly — that can drop named volumes (Coolify DB, etc.).

## Permanent fix status & follow-up

- Workflow cleanup now uses `-a` (PR #540) — auto-runs when `/` <8 GB.
- Open follow-up: a scheduled VPS cron `docker image prune -a -f && docker builder prune -a -f`
  (e.g. nightly) so disk never reaches the guard mid-deploy. Not yet added.

## Related

- `pre-push-hook.md` (build-config guard), `vercel-deployment.md` (legacy), MEMORY.md
  "Staging deploy fails when VPS disk fills" + `faster-ci-deploys.md`.
