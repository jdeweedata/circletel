# CI Deploy Speedup — Turbopack, BUILD_CPUS regression, runner realities

**Date:** 2026-06-10
**Trigger:** "deploys take ~30 min, should I move to GitLab?" → full CI build-pipeline optimization
**Outcome:** Prod builds ~17–21 min → **8m39s** (Turbopack), per-PR staging now opt-in, no vendor switch. PRs: #534, #535, #537, #538, #540.

---

## Key Learnings

### 1. Diagnose WHERE the time goes before switching CI vendors
The "30-min deploy" was a **build** problem (12–21 min Next.js build on one throttled core), not a GitHub problem. Switching to GitLab would have:
- run the identical build at the identical speed (vendor doesn't change build time),
- OOM'd on free SaaS runners (the app already OOMs GitHub's 7 GB hosted runners),
- **lost the "runner IS the prod VPS" trick** — the self-hosted runner builds *on* the prod box, so Coolify deploys with zero image transfer. Any SaaS/managed runner forces a GHCR image handoff.
- **Lesson:** When asked "should we switch tool X for speed?", first measure which stage is slow. A vendor swap only helps if the vendor owns the slow stage.

### 2. More build cores ≠ faster — `BUILD_CPUS=4` REGRESSED (measured)
On the 24 GB single VPS runner, `next.config.js` `cpus` raised 1→4:
| Config | Build time |
|---|---|
| cpus:1 webpack | **~21 min** (17 min warm cache) — reliable |
| BUILD_CPUS=4 webpack | **27 min** / **34.5 min (TIMED OUT → deploy cancelled)** |
| Turbopack cpus:1 | **10m14s** (staging) / **8m39s** (prod) |

4 webpack workers thrash GC against the 12 GB heap → *slower*, not parallel-faster. **Reverted** (PR #537). The real speedup is the bundler (Turbopack), not core count. **Lesson:** don't assume parallelism helps a memory-bound build; measure, and treat "un-throttle CPUs" as a hypothesis, not a fix.

### 3. Turbopack now builds this app — but validate SERVE-parity, not just compile
The old `next build --turbo` panic was on the `sanity` package; Sanity was removed, so `next build --turbopack` (Next 15.5 flag, not `--turbo`) now works. A build-only experiment proved it *compiles* (10m39s). But the real risk is **standalone-output serve-parity** — does the container boot and serve routes? Validated on staging: container healthy + `/`, `/check-coverage`, `/onboarding` all 200. **Lesson:** a green build ≠ a working deploy. For a bundler swap, the acceptance test is "container boots healthy and serves real routes," not "tsc/webpack exited 0."

### 4. Single self-hosted runner serializes — and concurrent actors trigger surprise deploys
- One `vps-runner` runs jobs sequentially; a queued job's "started" timestamp ≠ when its build runs (it waits for the runner). A 34-min "build" was partly a 40-min job timeout on a contended/thrashing build, not pure build time.
- A **mystery successful deploy** (sha not in my recent log) turned out to be another actor (Hermes/another session) merging PR #536 on top of my changes. **Lesson:** on a shared repo/box, `git fetch` before reasoning about "what's on main"; a deploy SHA you don't recognize is usually concurrent human/agent activity, not a bug. Verify ground truth (`curl /api/health`, container `StartedAt`) rather than trusting run metadata alone.

---

## Friction Points → Solutions (reusable)

### Throwaway CI experiment on a branch: use a `push:`-scoped trigger, NOT workflow_dispatch
`workflow_dispatch` workflows are only runnable once they're on the **default branch** — useless for a throwaway branch. Instead trigger on `push: branches: [the-experiment-branch]`; pushing the branch runs it, never auto-fires elsewhere, and deletes cleanly with the branch.

### `git branch -D` is blocked by the guardrail hook — don't circumvent
`.claude/hooks/block-dangerous-git.sh` blocks `git branch -D`. `git branch -d` refuses unmerged throwaway branches. Correct response: surface the block and give the user the command to run themselves. Do NOT bypass with `git update-ref -d` — that defeats a deliberate safety hook.

### Put CI/infra changes in a PR off `main`, not the current feature branch
`pull_request` workflows run from the base branch's version, and `deploy.yml` triggers on push to `main` — so CI changes only take effect on `main`. Branch off `origin/main` (stash-carry edits if needed), keep them out of unrelated feature PRs, and merge gives easy single-PR rollback.

### Add `.githooks/**` (and docs paths) to deploy `paths-ignore`
A hook/doc-only change was triggering full prod rebuilds because `.githooks/**` wasn't path-ignored. But note: modifying the workflow file itself is never path-ignored, so the PR that adds the ignore still triggers one build.

### VPS disk fills from back-to-back builds → `prune -a`, not `prune -f`
The deploy workflow's low-disk cleanup used `docker image/builder prune -f` (dangling only) → reclaimed ~0–361 MB; a build failed the 4 GB guard at 97% disk. Manual `docker builder prune -a -f && docker image prune -a -f` reclaimed ~4.7 GB (running containers safe). Fixed in workflow (PR #540). Recurs after many same-day builds.

### Monitoring long CI from the agent: scheduled wakeups + serialization awareness
External CI isn't harness-notified, so poll via `ScheduleWakeup`. On a single runner, a triggered build queues behind any in-flight one — account for serialization in ETAs. Cancel redundant queued deploys (`gh run cancel`) when a change doesn't affect the image.

---

## Recommended Actions
- [x] Reverted BUILD_CPUS=4 (#537); documented in `.claude/rules/coding-standards.md` Turbopack note
- [x] Turbopack live on prod (#538); serve-parity validated on staging first
- [x] Disk-cleanup `prune -a` fix (PR #540, open)
- [x] Auto-memory updated: `~/.claude/projects/-home-circletel/memory/faster-ci-deploys.md`
- [ ] Consider a scheduled VPS `docker prune -a` cron so disk never reaches the guard mid-deploy
- [ ] Optional: reduce `docker build --no-cache` cost (now ~6m of the deploy) with a freshness-safe cache strategy
