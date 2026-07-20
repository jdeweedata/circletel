# Phase 3 — Safety & Data Layer Checklist

**Source**: `docs/guides/CODEBASE_OPTIMIZATION_AUDIT.md` (findings H4, H5, M6, H6 part 2)
**Status**: Not started — checklist only. Phase 1 (#627) and Phase 2 (#628) are merged.
**Scope numbers measured**: 2026-07-19, against `main` after #628. These drift; re-measure with the commands shown before sizing any task.

---

## Context

Phase 3 is the "safety" band of the optimization roadmap: it hardens the data-access and error surfaces the audit flagged as High/Medium risk. Unlike Phases 1–2 (mechanical cleanup + perf), several items here change **authorization behavior**, so they are gated and sequenced deliberately — rename before migrate, approval before auth changes, ratchet before flipping build gates.

---

## Checklist

### [ ] #10 — H4a: Rename service-role Supabase client + CI guard (zero behavior change)

- Rename `createClient()` in `lib/supabase/server.ts` to `createServiceRoleClient()`; keep a deprecated `createClient` alias during migration so nothing breaks.
- Add a CI grep guard blocking **new** service-role imports outside `app/api/admin`, `app/api/cron`, `lib/inngest`.
- **Why first**: makes every RLS bypass visible/greppable and unblocks #11. No behavior change — reviewable and revertible on its own.
- **Scope**: 584 call sites import the service-role client today.
  ```bash
  grep -rl "from '@/lib/supabase/server'" app lib --include='*.ts' --include='*.tsx' | wc -l   # 584
  grep -rl "createClientWithSession" app lib --include='*.ts' | wc -l                          # 66
  ```
- **Gate**: standalone PR, lands before #11.

### [ ] #11 — H4b: Migrate user-facing API routes to session client (RLS) 🔒

- Audit non-admin / non-cron API routes handling **per-user** data and migrate them from the service-role client to `createClientWithSession()` so RLS applies instead of manual `.eq()` filters.
- Candidate areas (per-user data): `app/api/dashboard`, `orders`, `order-drafts`, `portal`, `customer`, `customers`, `contracts`, `invoices`, `kyc`.
- Per-area PRs, **after #10 lands**. Each area must verify RLS policies actually exist, or a migrated route returns empty results.
- **Gate**: 🔒 **Requires explicit user approval** — changes data-access auth (see `.claude/rules/auth-patterns.md`). **Blocked by #10.**

### [ ] #12 — H5: Shared API error responder + migrate error-leaking routes

- Create a shared responder: log the full error server-side (via `lib/logging`, with the `x-request-id` correlation the middleware already sets) and return a generic message + reference ID.
- Migrate routes that return raw `error.message` / `err.message` / `JSON.stringify(error)` to clients.
- Normalize inconsistent HTTP status codes through the same helper while touching each route.
- **Scope caveat**: the audit cited 145 (narrowest leak pattern). A broad grep now finds ~456 `app/api` files *referencing* `error.message` — but many only **log** it (safe). **First step: separate genuine client-facing leaks from safe logging** before sizing.
  ```bash
  grep -rl "error.message\|err.message" app/api --include='*.ts' | wc -l   # 456 (references, not all leaks)
  ```

### [ ] #13 — M6: Bound unbounded list queries + explicit columns on hot paths

- Add `.limit()` / `.range()` pagination to admin list endpoints returning unbounded result sets — largest tables first: `orders`, `invoices`, `coverage_leads`, `customers`.
- Replace `select('*')` with explicit column lists on hot paths.
- **Scope**: 392 `select('*')` usages.
  ```bash
  grep -rF "select('*')" app lib --include='*.ts' --include='*.tsx' | wc -l   # 392
  ```

### [ ] #14 — H6 part 2: Type-error burn-down toward flipping `ignoreBuildErrors` off

- Incrementally fix pre-existing TypeScript errors, ratcheting `.type-error-baseline` down after each batch (the Phase 1 ratchet CI job enforces no regressions).
- Goal: reach **0**, then flip `typescript.ignoreBuildErrors` off in `next.config.js` so the build gates on types.
- **Baseline**: 241 (`.type-error-baseline`). Error clusters seen in `lib/services`, `lib/invoices`, `lib/zoho`, `lib/storage` (mostly unknown-typed `catch` blocks).
- **Gate**: background / ongoing; batch by module.

---

## Sequencing

```
#10 (rename + guard, zero-behavior)  ──▶  #11 (RLS migration, per-area, APPROVAL)
#12 (error responder)   ── independent
#13 (query bounds)      ── independent
#14 (type-error burn-down) ── ongoing background
```

Recommended start: **#10** — small, safe, unblocks #11, matches the "rename first, migrate later" sequencing endorsed across the Phase 1/2 reviews. #12 and #13 are non-auth and can run in parallel / go first if preferred.

---

## Verification (applies to each item)

- `bash scripts/check-type-errors.sh` stays at/under baseline (no new type errors).
- For #11: exercise each migrated area end-to-end (a real logged-in user sees their own data; RLS doesn't hide it) before merging that area's PR.
- For #12: confirm no client response body contains internal error text after migration; the reference ID resolves to the logged full error.
- For #13: confirm list endpoints return bounded pages and hot-path responses are unchanged in shape.
