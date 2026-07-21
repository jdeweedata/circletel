# VPS DevOps Ops Checklist & Execution Plan

**Status**: Canonical  
**Date**: 2026-07-21  
**Host**: VPS 30 — `94.72.104.81` (24 GB RAM, 8 cores, ~193 GB disk)  
**Runtime**: Coolify (prod + staging containers)  
**CI build**: Self-hosted GitHub Actions runner on the same VPS  
**Related**: `.claude/rules/vps-devops.md`, `.github/workflows/README.md`, `docs/architecture/CRON_SCHEDULE.md`

---

## Architecture decision (do not reverse lightly)

| Layer | Choice | Why |
|-------|--------|-----|
| App runtime | Coolify on this VPS | Lowest hosting cost; full control |
| Heavy `next build` | Self-hosted GHA (`runs-on: self-hosted`) | Needs ~12 GB heap; GitHub-hosted (~7 GB) OOMs; Vercel Enhanced builds cost too much |
| Light CI (lint/type PR checks) | GitHub-hosted `ubuntu-latest` | Cheap; does not need 12 GB |
| Staging deploys | Opt-in via `deploy-staging` PR label | Prevents 25–30 min builds on every PR |

**Default recommendation**: keep this split. Upgrade path only when triggers fire (see [Upgrade triggers](#upgrade-triggers)).

```
PR opened
  ├─ pr-checks.yml          → GitHub-hosted (light)
  └─ staging-deployment.yml → label opt-in → push staging branch
       └─ deploy-staging.yml → self-hosted build → Coolify staging

Push to main (non-docs paths)
  └─ deploy.yml             → self-hosted: free RAM → disk guard → build
                               → local Docker image → Coolify recreate
                               → health wait
```

---

## 1. SLO targets (always optimal)

Use these as the definition of “healthy enough to build and serve.”

| Metric | Green | Yellow | Red (act now) |
|--------|-------|--------|----------------|
| Disk `/` free | ≥ 40 GB free (≤ ~80% used) | 15–40 GB free | **&lt; 8 GB free** (deploy.yml aborts at &lt; 4 GB after cleanup) |
| Available RAM before build | ≥ 14 GB available | 10–14 GB | **&lt; 10 GB** after cleanup |
| Load average (1m) vs 8 cores | &lt; 6 | 6–10 | **&gt; 12 sustained 5+ min** |
| Swap used | &lt; 2 GB | 2–4 GB | **&gt; 4 GB** (memory pressure) |
| Prod container health | `healthy` | restarting &lt; 2×/day | **unhealthy / crash loop** |
| Staging container health | `healthy` when in use | stopped OK if unused | crash loop |
| Deploy job duration (Turbopack) | ≤ 25 min | 25–40 min | **&gt; 50 min** or timeout (60) |
| Deploy queue (jobs waiting on runner) | 0 | 1 | **≥ 2** or blocked &gt; 1 h |
| Runner online | Online in GitHub | Idle &gt; 7 days (check) | Offline |

---

## 2. Daily checklist (5 minutes)

Run on the VPS (SSH) or via agent with root/ops access.

```bash
# --- Host snapshot ---
date -u
uptime
free -h
df -h /
systemctl --failed --no-pager

# --- Coolify / app ---
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -20
# Prod is Coolify-managed; name suffix changes — use labels:
docker ps --filter 'label=coolify.name=b7ukn3c76rd46dsl19oqq59e' --format '{{.Names}} {{.Status}}'
docker ps --filter 'name=circletel-staging' --format '{{.Names}} {{.Status}}'

# --- Runner ---
systemctl is-active actions.runner.jdeweedata-circletel.vps-runner.service 2>/dev/null \
  || systemctl list-units --type=service --all | grep -i runner

# --- Top consumers ---
ps aux --sort=-%mem | head -8
```

**Pass criteria**
- [ ] Disk free ≥ 15 GB (prefer ≥ 40 GB)
- [ ] Available RAM ≥ 10 GB (prefer ≥ 14 GB when idle)
- [ ] Prod container **healthy**
- [ ] No unexpected `systemctl --failed` (ignore known benign `systemd-networkd-wait-online` unless networking is broken)
- [ ] No orphan `next dev` / host-level `next-server` outside Docker eating multi‑GB RAM
- [ ] Runner service active; no stuck multi-hour `node` build if no deploy is intentional

**If Red**: do [Emergency procedures](#6-emergency-procedures) before starting another build.

---

## 3. Pre-deploy checklist (before merge to `main` or manual deploy)

- [ ] **Primary checkout clean** or work is on a feature worktree (see `git-tree-hygiene`)
- [ ] No active self-hosted job: GitHub → Actions → confirm runner idle
- [ ] `free -h` available ≥ 12 GB; `df -h /` free ≥ 10 GB
- [ ] Avoid concurrent heavy work: full `npm run build:memory`, multiple agents, Playwright browser farms, large Docker builds
- [ ] Staging validated if UI/API risky (add `deploy-staging` label only when needed)
- [ ] Secrets/env changes applied in Coolify **before** expecting runtime to pick them up
- [ ] Paths that only touch `docs/**`, `*.md`, `.claude/**` etc. do **not** need a prod deploy (`deploy.yml` paths-ignore)

**Do not** set `BUILD_CPUS=4` on this host for prod build — measured thrash (27–34 min) vs ~21 min at `cpus:1`; Turbopack is the speedup, not more cores.

---

## 4. Weekly checklist (15–25 minutes)

### 4.1 Disk & Docker hygiene

```bash
df -h /
docker system df
# Safe: unused images/containers/networks (running containers kept)
docker image prune -f
docker container prune -f
# Only if free < 25 GB and no deploy running:
# docker image prune -a -f
# docker builder prune -a -f

# Runner / cache bulk (only if disk Yellow/Red)
du -sh /home/actions-runner/node_modules.tar \
       /home/actions-runner/.next-cache \
       /tmp/buildx-cache 2>/dev/null
journalctl --disk-usage
# journalctl --vacuum-size=200M
```

- [ ] `docker system df` reviewed; reclaim dangling images if free &lt; 40 GB
- [ ] Old runner `_diag` logs cleaned if large (`find /home/actions-runner/_diag/ -name '*.log' -mtime +7 -delete`)
- [ ] Playwright/browser caches not multi‑GB on disk unless needed

### 4.2 Runner & CI

- [ ] GitHub → Settings → Actions → Runners: **Idle/Online**, labels correct
- [ ] Last 5 `Build & Deploy` runs: success rate; duration trend
- [ ] Staging deploys only when label used (no surprise 30 min jobs)
- [ ] No workflow incorrectly set to `runs-on: self-hosted` for light work

### 4.3 Application health

- [ ] Prod homepage + one API smoke (auth not required path)
- [ ] Coolify resource graphs: CPU/RAM for app containers not pegged 24/7
- [ ] Cron log tail: `/var/log/circletel-cron.log` — integrations not all `down`
- [ ] Payment sync backlog not growing unboundedly (known: stale pending count — track, don’t ignore)

### 4.4 Git / tree (host checkout)

- [ ] `/home/circletel` on clean `main` tracking `origin/main` (`git pull --ff-only` if behind)
- [ ] Worktree count roughly ≤ 8 active topics; prune merged (see `git-tree-hygiene`)
- [ ] No multi‑day untracked secrets or large artifacts on primary checkout

### 4.5 Security / access

- [ ] Runner only used for trusted CircleTel workflows (repo-scoped)
- [ ] No long-lived credentials in world-readable files under `/tmp`
- [ ] Coolify and Docker sockets not exposed publicly

---

## 5. Monthly checklist (30–45 minutes)

- [ ] Review upgrade triggers below — still on single-box or need builder VPS?
- [ ] Coolify, Docker, runner package updates (schedule maintenance window)
- [ ] Node version on runner vs Dockerfile base (align when major changes)
- [ ] GHCR / local image retention: keep last N prod tags; prune rest
- [ ] Re-read `deploy.yml` / `deploy-staging.yml` for drift (heap, cpus, paths-ignore)
- [ ] Confirm `CRON_SECRET` / `/root/.cron-env` still valid for crontab curls
- [ ] Capacity: if load avg regularly &gt; 8 during business hours, plan dedicated builder

---

## 6. Emergency procedures

### 6.1 Deploy failing: disk

```bash
df -h /
# While NO critical deploy mid-write:
docker image prune -a -f
docker builder prune -a -f
npm cache clean --force
journalctl --vacuum-size=100M
rm -rf /tmp/buildx-cache /tmp/com.google.Chrome.scoped_dir.* 2>/dev/null || true
rm -rf /root/.cache/ms-playwright/ 2>/dev/null || true
df -h /
```

Abort if still &lt; 4 GB free — free more (old worktrees, logs) before retry.

### 6.2 Deploy failing: OOM / killed build

```bash
free -h
# Prefer stop non-prod consumers first (agents, headless Chrome, host next dev)
# Do NOT kill Coolify prod container unless necessary
# Then re-run deploy workflow (workflow_dispatch or push)
```

Match `deploy.yml` “Free memory for build” spirit: orphan `next dev`, headless Chrome, heavy IDE servers — not the healthy prod container.

### 6.3 Prod unhealthy after deploy

```bash
CONTAINER=$(docker ps --filter 'label=coolify.name=b7ukn3c76rd46dsl19oqq59e' --format '{{.Names}}' | head -1)
docker logs --tail 100 "$CONTAINER"
docker inspect --format='{{.State.Health.Status}}' "$CONTAINER"
# Rollback: previous image tag if retained, or Coolify redeploy previous known-good
```

See also `docs/deployment/ROLLBACK_PROCEDURE.md` if present and current.

### 6.4 Runner offline

```bash
systemctl status 'actions.runner.*' --no-pager
# cd /home/actions-runner && sudo ./svc.sh status
# journalctl -u 'actions.runner.*' -n 50 --no-pager
```

Re-register only with current GitHub runner token process; do not leave two runners double-consuming the host without intent.

### 6.5 Load spike during agents + deploy

1. Prefer **defer deploy** 15–30 min over killing prod.  
2. Stop nonessential agent/browser processes.  
3. One deploy at a time (prod concurrency group already `cancel-in-progress: false` — do not start staging build in parallel if RAM tight).

---

## 7. Workload rules (always)

| Workload | Where | Notes |
|----------|-------|--------|
| `next build` (prod/staging images) | Self-hosted only | `NODE_OPTIONS=--max-old-space-size=12288` |
| Lint / light type-check / small tests | GitHub-hosted | Do not pin to self-hosted |
| Staging full build | Self-hosted + **label** `deploy-staging` | Never on every PR by default |
| Prod runtime | Coolify Docker | Prefer label lookup over hardcoded container suffix |
| Agent/dev servers on VPS | Allowed carefully | Stop before large deploys; no multi‑GB orphan `next dev` left overnight |
| Vercel production builds | **Not** primary path | Vercel Enhanced cost/memory; Coolify is SoT for prod |

**Hard constraints**
1. Never run two full CircleTel production-class builds in parallel on this VPS.  
2. Never force `BUILD_CPUS=4` for prod on this box without a re-benchmark.  
3. Never delete running Coolify DB/redis containers during “cleanup.”  
4. Never `docker system prune -a` blindly without checking free space need and running set.  
5. Container names from Coolify **change suffix** — always filter by `coolify.name` label for prod.

---

## 8. Execution plan

### Phase 0 — Baseline (day 0, ~30 min) ✅ decision already made

| # | Task | Owner | Done when |
|---|------|-------|-----------|
| 0.1 | Confirm architecture: Coolify runtime + self-hosted build | Ops | This doc accepted |
| 0.2 | Record baseline: `free -h`, `df -h`, last deploy duration, runner status | Ops | Numbers in weekly notes or handoff |
| 0.3 | Link rule file for agents: `.claude/rules/vps-devops.md` | Agent | File exists |

### Phase 1 — Operationalize checklists (week 1)

| # | Task | Effort | Done when |
|---|------|--------|-----------|
| 1.1 | Run **Daily** checklist once and fix any Red items | 30–60 min | Green host |
| 1.2 | Add calendar or cron reminder for **Weekly** (e.g. Mon 08:00 with git-hygiene) | 15 min | Reminder exists |
| 1.3 | Ensure runner service enabled on boot | 10 min | `systemctl is-enabled` ok |
| 1.4 | Document actual runner unit name in handoff if different from example | 5 min | Name recorded |
| 1.5 | Verify staging remains **label-gated** | 10 min | No auto build every PR |
| 1.6 | Align primary `/home/circletel` with `origin/main` | 10 min | `0/0` ahead/behind |

### Phase 2 — Guardrails & automation (weeks 2–3)

| # | Task | Effort | Done when |
|---|------|--------|-----------|
| 2.1 | Prefer runner labels `self-hosted` + `circletel-build` in workflows (optional hardening) | 30 min | Workflows updated + runner labeled |
| 2.2 | Weekly disk prune script or documented one-liner in crontab (safe prune only) | 45 min | Free space stable week-over-week |
| 2.3 | Alert path for failed deploy (GitHub email / Slack if available) | 30 min | Failures noticed &lt; 1 h |
| 2.4 | Cap concurrent heavy agents during known deploy windows | process | Documented in this file + agent rule |
| 2.5 | Confirm deploy.yml disk/memory preflight still matches reality | 20 min | No silent drift |

### Phase 3 — Capacity decision (month 1–2, only if triggers hit)

| # | Task | Effort | Done when |
|---|------|--------|-----------|
| 3.1 | Measure: deploy failures due to RAM/load, or queue time | ongoing | Data for 2–4 weeks |
| 3.2 | If triggers met → provision **dedicated builder** (8+ vCPU, 32 GB) OR Coolify-native build trial | 1–2 days | Builds off prod host or simplified pipeline |
| 3.3 | If not met → stay single-box; re-evaluate next quarter | 0 | Decision logged |

### Phase 4 — Continuous improvement (ongoing)

| # | Task | Notes |
|---|------|--------|
| 4.1 | Keep Turbopack prod build unless regression | Revert path: plain `npm run build` in deploy.yml |
| 4.2 | Reduce app build cost long-term | Route split, less admin in same bundle — product/eng |
| 4.3 | Integration/cron health (5 healthy / 3 down pattern) | Separate from build host but affects “ops green” |

---

## Upgrade triggers

Move off “build on prod VPS” only when **any** of these hold for 2+ weeks:

1. Deploy success rate &lt; 90% due to host resource contention  
2. Available RAM before build often &lt; 10 GB despite cleanup  
3. Sustained load &gt; 10 during business hours with agents + Coolify  
4. Deploy queue regularly ≥ 1 job waiting &gt; 30 min  
5. Disk free repeatedly &lt; 15 GB despite weekly prune  

**Preferred upgrade**: dedicated build VPS (keep GHA workflows, change `runs-on` / runner registration).  
**Alternative**: Coolify-native git builds (simpler GHA, same host contention unless builder separated).  
**Avoid**: Vercel Enhanced as primary build farm for cost reasons.

---

## Quick command card

```bash
# Health one-liner
echo "=== $(date -u) ===" && uptime && free -h | sed -n '1,2p' && df -h / | tail -1 && \
  docker ps --filter 'label=coolify.name=b7ukn3c76rd46dsl19oqq59e' --format 'prod: {{.Names}} {{.Status}}' && \
  docker ps --filter 'name=circletel-staging' --format 'staging: {{.Names}} {{.Status}}'

# Safe light prune
docker image prune -f && docker container prune -f

# Aggressive prune (no deploy running; free space critical)
docker image prune -a -f && docker builder prune -a -f && journalctl --vacuum-size=100M

# Prod logs
C=$(docker ps --filter 'label=coolify.name=b7ukn3c76rd46dsl19oqq59e' --format '{{.Names}}' | head -1)
docker logs --tail 80 "$C"
```

---

## References

| Doc / path | Purpose |
|------------|---------|
| `.github/workflows/deploy.yml` | Prod build + deploy (memory free, disk guard, Turbopack, Coolify) |
| `.github/workflows/deploy-staging.yml` | Staging build |
| `.github/workflows/staging-deployment.yml` | Label-gated staging branch push |
| `.github/workflows/README.md` | Pipeline overview |
| `.claude/rules/vps-devops.md` | Agent-enforced DevOps rules |
| `.claude/rules/git-tree-hygiene.md` | Primary checkout + worktrees |
| `docs/architecture/CRON_SCHEDULE.md` | Crontab as scheduler of record |
| `docs/deployment/ROLLBACK_PROCEDURE.md` | Rollback if still accurate |

---

**Version**: 1.0 · **Updated**: 2026-07-21
