# VPS DevOps & Maintenance Rules

**Trigger**: Deploying, debugging builds, Coolify/Docker, self-hosted runner, disk/RAM/load issues, VPS maintenance, CI workflow changes, “why is the server slow”, cron health on host  
**Scope**: VPS 30 (`94.72.104.81`) — Coolify runtime + self-hosted GitHub Actions builds  
**Canonical checklist**: `docs/deployment/VPS_DEVOPS_OPS_CHECKLIST.md`

---

## Architecture (do not reverse without explicit user approval)

| Layer | Required choice |
|-------|-----------------|
| Production runtime | Coolify Docker on this VPS |
| Heavy `next build` / image build | Self-hosted GHA runner on VPS (or future dedicated builder) |
| Light PR checks | GitHub-hosted `ubuntu-latest` |
| Staging full builds | Opt-in only (`deploy-staging` label) — never re-enable build-on-every-PR |
| Primary build farm | **Not** Vercel Enhanced (cost + memory history) |

**Build heap**: prod/staging deploy workflows use `NODE_OPTIONS='--max-old-space-size=12288'`.  
**CPUs**: leave `BUILD_CPUS` unset for prod (effective `cpus:1`). Do not set `BUILD_CPUS=4` without a new benchmark — thrash was measured slower on this host.

---

## Performance SLOs (agents must respect)

Before starting a full deploy or heavy local build on the VPS, check:

| Check | Abort / escalate if |
|-------|---------------------|
| `df -h /` | Free &lt; 8 GB (deploy.yml fails hard near 4 GB) |
| `free -h` available | &lt; 10 GB available and a deploy is required — free memory first |
| Load average (1m) | &gt; 12 sustained — defer noncritical builds |
| Existing self-hosted job | Another deploy/build already running — do not start a second full build |
| Prod container | Unhealthy — fix runtime before new feature deploys |

Target after cleanup for a deploy: **≥ 12–14 GB RAM available**, **≥ 10 GB disk free** (prefer ≥ 40 GB free steady-state).

---

## Hard rules (ALWAYS / NEVER)

### ALWAYS

1. **Prefer label-based container discovery** for prod:  
   `docker ps --filter 'label=coolify.name=b7ukn3c76rd46dsl19oqq59e'`  
   Coolify renames container suffixes — hardcoded full names break health checks.
2. **One heavy CircleTel build at a time** on this VPS (prod image build, staging image build, or local `build:memory` — not in parallel).
3. **Keep staging label-gated** when editing `staging-deployment.yml` / deploy-staging triggers.
4. **Free or identify memory hogs before build**: orphan `next dev` / host `next-server` outside Docker, headless Chrome, multi‑GB IDE servers — not the healthy Coolify prod app.
5. **Disk before image build**: if free &lt; 8 GB, prune safely (`docker image prune`, builder prune, journals) before retry.
6. **After deploy**: wait for container **healthy**; show logs on failure; do not claim success without health evidence.
7. **Primary git checkout**: keep `/home/circletel` on clean tracking `main`; feature work in worktrees (`git-tree-hygiene.md`).
8. **paths-ignore awareness**: docs/md-only changes may not trigger `deploy.yml` — do not assume every push deploys.

### NEVER

1. **Never** move production builds back to Vercel as the default cost-saving “fix” without an explicit capacity/cost decision.
2. **Never** pin light lint/type jobs to `self-hosted` without need — wastes the only fat runner.
3. **Never** run `docker system prune -a` / `docker image prune -a` during an active deploy without confirming impact.
4. **Never** kill Coolify `coolify-db`, `coolify-redis`, or proxy as “memory cleanup.”
5. **Never** hardcode ephemeral Coolify container name suffixes in new scripts (use labels).
6. **Never** set `BUILD_CPUS=4` on this host for prod workflow without re-measuring wall time + RAM.
7. **Never** leave multi‑GB orphan Node/Next processes on the host overnight after agent sessions.
8. **Never** use `git commit --no-verify` to skip secret scan when changing deploy secrets/scripts.

---

## Maintenance cadence (agents: suggest or run when asked “doctor” / ops)

| Cadence | Minimum |
|---------|---------|
| Daily | `uptime`, `free -h`, `df -h /`, prod container healthy, runner up |
| Weekly | Docker `system df` + light prune; runner job success; worktree count; cron log spot-check |
| Monthly | Capacity review vs upgrade triggers in the ops checklist |

Full commands: `docs/deployment/VPS_DEVOPS_OPS_CHECKLIST.md`.

---

## Safe cleanup order

When freeing resources for a build:

1. Orphan host `next dev` / non-Docker `next-server` (user.slice only)  
2. Headless Chrome / chrome-devtools-mcp  
3. Heavy optional IDE/agent helpers (only if policy allows; prefer ask for interactive tools)  
4. `docker image prune -f` (dangling)  
5. If still tight: `docker image prune -a -f` + `docker builder prune -a -f` **when no deploy running**  
6. `journalctl --vacuum-size=100M`  
7. Old `/tmp/buildx-cache`, Playwright caches if disk critical  

Do **not** drop Coolify app/db/redis containers in this list.

---

## Workflow edit rules

When changing `.github/workflows/deploy.yml` or `deploy-staging.yml`:

- Keep disk preflight (≥ 4 GB fatal after cleanup; prefer acting at 8 GB).  
- Keep memory free step intent (or improve it) — do not remove without replacement.  
- Keep image commit verification if present.  
- Keep health wait with **dynamic** container name resolution.  
- Keep `concurrency` groups so prod deploys do not cancel each other carelessly (`cancel-in-progress: false` for prod).  
- Document any runner label changes in `.github/workflows/README.md` + ops checklist.

PR checks (`pr-checks.yml`) may stay non-blocking for historical type debt — do not “fix” by moving full `build:memory` onto self-hosted for every PR.

---

## Upgrade path (recommend only when triggered)

Triggers (2+ weeks): deploy success &lt; 90% from contention; RAM &lt; 10 GB before builds often; load &gt; 10 sustained; deploy queue; disk thrash.

1. **First choice**: dedicated builder VPS + same GHA workflows  
2. **Alternative**: Coolify-native git build (simpler; same host unless builder split)  
3. **Not preferred**: Vercel Enhanced as primary CI for this app  

Do not implement upgrade without user approval (cost + infra change).

---

## Related files

| Path | Role |
|------|------|
| `docs/deployment/VPS_DEVOPS_OPS_CHECKLIST.md` | Full checklist + execution plan |
| `.github/workflows/deploy.yml` | Prod pipeline |
| `.github/workflows/deploy-staging.yml` | Staging pipeline |
| `.github/workflows/README.md` | CI overview |
| `.claude/rules/git-tree-hygiene.md` | Checkout/worktrees |
| `.claude/rules/vercel-deployment.md` | Vercel-specific (previews/legacy), not primary prod build |
| `docs/architecture/CRON_SCHEDULE.md` | Crontab SoT |

---

## DO / DON’T summary

| DO | DON’T |
|----|--------|
| Check disk/RAM/load before heavy builds | Start parallel full builds on one VPS |
| Use Coolify labels for prod container | Hardcode Coolify name suffixes |
| Keep staging opt-in | Auto-build staging every PR |
| Prune Docker when free space Yellow/Red | Prune DB volumes or running prod stack |
| Point ops work at the checklist | Invent a new deploy topology casually |
