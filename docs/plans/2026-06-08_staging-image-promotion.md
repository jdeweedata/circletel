# Plan: Staging → Production Image Promotion

**Date**: 2026-06-08
**Status**: PROPOSED — not started. Decision pending (see Recommendation).
**Author**: Claude Code (session with Jeffrey)
**Related**: `.github/workflows/deploy.yml`, `.github/workflows/deploy-staging.yml`, `.claude/rules/pre-push-hook.md`

---

## 1. Goal

Stop production from running a full ~20-minute `next build` on commits that were **already built and verified on staging**. Promote the staging-built Docker image to production instead of rebuilding it.

**Payoff if delivered:**
- ~1,200 build-min/month saved (60 prod builds × ~20 min).
- The production-build queue disappears — prod deploys become a fast image re-tag + `docker compose up`, so they no longer serialize behind an in-flight staging build on the single self-hosted runner.

**Origin:** Surfaced 2026-06-08 when merging PR #518 (the shared pre-push hook) to `main` triggered a 20-min prod build that queued ~16.5 min behind an in-flight staging build on the single `vps-runner`.

---

## 2. The Blocker — why naive promotion is UNSAFE

The staging and production builds are **NOT** producing the same artifact. The only build-time difference is two environment variables, but they are baked into the bundle:

| Var | Staging build | Production build |
|-----|---------------|------------------|
| `NEXT_PUBLIC_APP_URL` | `https://staging.circletel.co.za` | `https://www.circletel.co.za` |
| `NEXT_PUBLIC_BASE_URL` | `https://staging.circletel.co.za` | `https://www.circletel.co.za` |

All other build env (Supabase URL/keys, NetCash keys, Google Maps, Sanity) is identical.

`NEXT_PUBLIC_*` variables are **inlined into the compiled output at build time**. A staging image therefore has `staging.circletel.co.za` literally compiled into code paths that, in production, MUST use `www.circletel.co.za`:

- `app/api/payments/*`, `app/api/payment/netcash/*` — NetCash **redirect URLs** and **webhook callback URLs**
- `app/api/auth/password-reset`, `app/auth/confirm`, `app/api/auth/resend-verification`
- Email notification absolute links, quote share links

**Consequence of promoting a staging image to prod as-is:** production payment redirects, NetCash webhooks, and password-reset links would point customers at `staging.circletel.co.za`. This is a silent, severe, payment-and-auth-breaking defect. **Do not promote the image without first removing the build-time URL baking.**

---

## 3. Investigation findings (2026-06-08)

Grep of `app/`, `components/`, `lib/` for `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL`:

- **67 files** reference the two vars.
- **67 server-side, 0 client (`'use client'`) components.**
- Distribution: 25 files in `app/api/**`, 37 in `lib/**`, remainder server components / route handlers.

**Why this matters:** because there are zero client usages, the refactor is a pure **server-side** change. Server code can read a plain runtime env var (`process.env.APP_URL`) from the container environment — no client-side `window.location.origin` fallback is required. This de-risks the change from "touches client and server" to "mechanical server-side swap."

---

## 4. Proposed change

### Task 0 — Confirm scope (≈1 hr)
Re-run the grep and spot-check the 67 files to confirm none gained a `'use client'` directive and none rely on the value at module-eval time in a way that resists a helper call. Capture the exact reference list.

### Task 1 — Runtime base-URL resolution (≈3–4 hrs, TDD)
- Add a server-only helper, e.g. `lib/utils/base-url.ts` → `getBaseUrl()`:
  - reads `process.env.APP_URL` (new, **non-`NEXT_PUBLIC_`**, resolved at container runtime),
  - falls back to request headers (`x-forwarded-host` / `host`) where a request is in scope,
  - final fallback to a safe default.
- Write unit tests for `getBaseUrl()` FIRST (env set, env unset + headers, neither).
- Replace the 67 files' `process.env.NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` reads with `getBaseUrl()`.
- **Search before creating:** check for an existing base-URL helper (e.g. `lib/utils/webhook-urls.ts` already builds webhook URLs) and extend it rather than adding a parallel one.

### Task 2 — Make the image environment-agnostic
- Remove `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL` from the `Build Next.js` env block in **both** `deploy.yml` and `deploy-staging.yml`.
- Provide `APP_URL` at **runtime** instead:
  - Production: add `APP_URL=https://www.circletel.co.za` to the Coolify app env (app UUID `b7ukn3c76rd46dsl19oqq59e`).
  - Staging: add `APP_URL=https://staging.circletel.co.za` to `/home/circletel/.env.staging` (already injected via `--env-file`).

### Task 3 — Rewire `deploy.yml` to promote, not rebuild
Production flow on `push: main`:
1. Resolve the image built for this commit by the staging run — tagged `ghcr.io/jdeweedata/circletel:<git-sha>` (the prod build already tags by `${{ github.sha }}`; have the staging build tag by SHA too so the SHA is shared across the staging→main fast-forward).
2. **If the SHA image exists locally:** `docker tag` it to the prod `:latest`, run the existing **Verify image commit** step, then `docker compose up -d --force-recreate --no-build --pull never`. **No `next build`.**
3. **If it does NOT exist** (hotfix pushed straight to `main`, or staging image pruned): fall back to the current full build path unchanged.

> Note: staging and main must share the **same commit SHA** for the lookup to hit. The staging→PR→main flow fast-forwards the same commits, so the SHA is identical. Squash-merges produce a *new* SHA on main → the lookup misses and falls back to a rebuild. Decide whether to (a) accept rebuild-on-squash, or (b) switch the staging→main step to a merge/fast-forward that preserves the SHA. (a) is simpler and still saves the non-squash majority.

---

## 5. Risk

**Blast radius: HIGH.** 67 server files, concentrated in payment, auth, and webhook code on a live billing platform.

Verification gates before this ships:
- `getBaseUrl()` unit tests green.
- Staging soak: confirm NetCash redirect, NetCash webhook callback, password-reset link, and quote-share link all resolve to `staging.circletel.co.za` at runtime.
- Production smoke after first promoted deploy: same four URLs resolve to `www.circletel.co.za` — **not** staging.
- Roll-back plan: keep the previous prod `:latest` tagged (e.g. `:rollback`) so `docker compose up` can revert instantly.

---

## 6. Alternatives considered

| Option | Effort | Risk | Payoff |
|--------|--------|------|--------|
| **Image promotion (this plan)** | ~1 day + soak | High (payment/auth) | ~1,200 min/mo; prod-build queue eliminated |
| `paths-ignore += .githooks/**` in both deploy workflows | ~5 min | ~0 | Stops hook/config-only commits triggering 20-min builds (partial — `package.json` changes still trigger) |
| Move builds to **Depot** managed runners | ~½ day | Low | Parallel ephemeral runners → queue gone, no payment-code refactor, ~$20–28/mo (Developer tier) |
| Second self-hosted runner on the VPS | ~1 hr | **Unsafe** | Two concurrent 12 GB-heap builds on a 24 GB VPS → OOM. Rejected. |

---

## 7. Recommendation

**Do not start the 67-file payment-code refactor right now.** Tonight's queue wait was caused by single-runner serialization, not by cheaply-removable redundant builds — and the refactor touches payment/auth/webhook code on a billing platform with a tight runway.

Sequenced recommendation:
1. **Now (safe):** add `.githooks/**` to `paths-ignore` in both deploy workflows. Partial but zero-risk.
2. **Queue fix:** prefer **Depot** managed runners (parallel, no contention, no refactor) over this refactor — same outcome, far lower risk. See the Depot costing analysis from the 2026-06-08 session.
3. **Revisit this plan** only if you later decide to drop Depot/self-hosted entirely and want production to never rebuild.

This document exists so the analysis is on record; it is **not** an instruction to implement.
