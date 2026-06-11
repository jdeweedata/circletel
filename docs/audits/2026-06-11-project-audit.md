# CircleTel Project Audit — 2026-06-11

**Auditor:** Claude Code (full project review: security, code health, CI/CD, dependencies)
**Branch at time of audit:** `feat/onboarding-dashboard-v3`
**Scope:** 346 pages, 604 API routes, ~2,200 TS/TSX files, 11 GitHub workflows
**Verification note:** All Critical security findings were verified by reading the actual route source — not just scanner output.

---

## Executive Summary

| Area | Grade | Headline |
|------|-------|----------|
| **API Security** | 🔴 Critical gaps | 5 unauthenticated endpoints expose/mutate customer PII; eMandate webhook accepts forged postbacks |
| **Secrets Hygiene** | 🔴 Critical | 7 Google API keys committed in tracked docs/test files |
| **Dependencies** | 🟡 Medium | 6 high + 5 moderate npm vulnerabilities |
| **Code Health** | 🟡 Medium | Dead backup files in routes, duplicate PDF generators/billing types, component-kit migration half-done |
| **Test Coverage** | 🟡 Medium | ~2.8% (83 test files); billing/payments OK, auth/activation near-zero |
| **CI/CD** | 🟢 Good | 11/15 recent runs green; SHA verification, disk guards, scoped pre-push hook all working |
| **TypeScript config** | 🟢 Good | `strict: true`; ~295 baseline errors managed via scoped pre-push hook |

The auth **architecture** (three-context, RBAC, header+cookie) is solid and used correctly by ~325 of ~327 admin routes (739 `authenticateAdmin` call sites). The critical findings are individual routes that *skipped* a good pattern — not a broken pattern. All Phase 1 fixes follow existing in-repo patterns.

---

## Findings Detail

### CRITICAL — Security (exploitable on production today)

#### SEC-1: Customer PII readable/writable without auth
- **File:** `app/api/customers/route.ts`
- **GET** `?email=` or `?id=` returns the **full** customer record (`select('*')`) using the service-role client (RLS bypassed). Anyone can enumerate customer names, phones, account details by email. POPIA exposure.
- **POST** updates any customer's name/phone/account_type keyed by email — no auth.

#### SEC-2: Account linking trusts request body
- **File:** `app/api/customers/ensure/route.ts` (lines ~50, ~102)
- Accepts arbitrary `auth_user_id` in the POST body and creates/links customer rows for it without verifying the caller's session. Allows attaching customer records to an attacker-controlled user.

#### SEC-3: NetCash eMandate webhook — no signature verification
- **File:** `app/api/webhooks/netcash/emandate/route.ts`
- Accepts postbacks blind. Anyone who finds the URL can mark debit-order mandates as signed/active → directly threatens billing/revenue integrity (mandate status gates collection).
- **Reference pattern that IS correct:** `app/api/webhooks/netcash/zoho-billing/route.ts` (HMAC-SHA256 + `crypto.timingSafeEqual`) and `app/api/webhooks/resend/route.ts` (HMAC + 5-min replay window). Copy these.

#### SEC-4: Unauthenticated admin routes (supplier moat leak)
- **Files:** `app/api/admin/suppliers/route.ts`, `app/api/admin/sync-summary/route.ts` (and verify `app/api/admin/suppliers/sync/route.ts`)
- No `authenticateAdmin()` call. Leaks supplier catalogue, product counts, sync logs, cost changes — the "7,438-product supplier moat" — to the public internet.

#### SEC-5: Payment initiation without ownership check
- **File:** `app/api/invoices/initiate-payment/route.ts`
- Takes `invoiceId` from the body with no auth/ownership verification. Leaks invoice data and allows initiating payments against any invoice.

#### SEC-6: Committed Google API keys (7 distinct `AIza…` keys)
- **Files (tracked in git):**
  - `.playwright-mcp/test-fish-eagle/*` (4 report files — entire dir shouldn't be in the repo)
  - `docs/deployment/NETLIFY_ENV_VARS.md`
  - `docs/deployment/SUPABASE_KEY_FIX_2025-10-20.md`
  - `docs/integrations/COVERAGE_API_FEASIBILITY_ANALYSIS.md`
  - `docs/integrations/COVERAGE_API_KEY_FINDINGS.md`
  - `docs/integrations/mtn/MTN_WHOLESALE_TEST_PAGE_IMPLEMENTATION.md`
  - `docs/environment-examples/.env.local.template`
- Even referrer-restricted Maps keys are billable quota. Keys persist in git history after deletion → **rotation is the real fix**, removal is hygiene.

#### SEC-7: Public test endpoints
- `app/api/test-email/route.ts` — anyone can send email from the CircleTel Resend account (spam/cost vector, default recipient hardcoded).
- `app/api/test/supabase/route.ts` — infrastructure disclosure (Supabase URL/key prefix).

### HIGH

#### SEC-8: More unverified webhooks
- `app/api/webhooks/clickatell/delivery/route.ts` — no verification (SMS delivery-status spoofing).
- `app/api/webhooks/whatsapp/route.ts` — GET handshake verified, **POST has no signature check** (Meta sends `X-Hub-Signature-256`; verify against the app secret).

#### DEP-1: npm vulnerabilities (6 high / 5 moderate)
- Plain `npm audit fix` (safe): `tmp` <0.2.6 (path traversal, HIGH), `brace-expansion` (moderate).
- Needs `--force` + staging verification: `serialize-javascript` (HIGH), `uuid`, `postcss` (nested under `next`).

#### CODE-1: Dead backup files inside route directories
- `app/admin/sales/feasibility/page.backup.tsx` (1,419 lines)
- `app/admin/orders/page-old.tsx`
- `app/api/admin/login/route.backup.ts`
- Next.js doesn't route these names, but they pollute grep/blast-radius analysis and risk accidental import. Git history preserves them — delete.

#### CODE-2: Untracked finished work at risk
- `app/forms/page.tsx`, `app/products/cloudwifi/`, `app/services/growth-ready/`, `app/services/mid-size/page.tsx`, `app/services/security/`, `components/resources/`
- ~80KB of complete, SEO-ready pages sitting untracked. One `git clean`/disk incident loses them. Commit or explicitly discard.

### MEDIUM

#### CODE-3: Duplicate implementations with no canonical marker
- `lib/quotes/pdf-generator.ts` (613 lines) **vs** `lib/quotes/pdf-generator-v2.ts` (422 lines) — both alive.
- `lib/types/billing.ts` (legacy) **vs** `lib/types/billing.types.ts` (modern).
- `components/shared/StatCard.tsx` + `components/shared/StatusBadge.tsx` (legacy) **vs** `components/backend/*` (canonical, with shims at `components/admin/shared/`) — migration half-done; legacy versions still imported directly in places, so two visual styles can drift on screen.
- `components/payment/` vs `components/payments/`; `lib/services/supabase.ts` vs `lib/supabase/*`.

#### TEST-1: Coverage gaps on critical paths
- 83 test files (~2.8% of codebase). Billing/payments reasonably covered (webhook validator, invoice matching, e-mandate E2E). Near-zero: auth routes, admin auth guards, activation logic. No full signup→order→payment→activation E2E.
- Highest-value single test: a guard test asserting every `app/api/admin/**/route.ts` (minus the 4 public auth routes) contains an auth call — makes SEC-4 a permanent regression class.

#### TYPE-1: Type-system noise (managed, ratchet only)
- 726 `any` usages; ~295 baseline `tsc` errors masked by `ignoreBuildErrors: true`; 555 `console.log` in `app/api` + `lib` (use `apiLogger`); 106 TODO/FIXME markers in 76 files.
- The scoped pre-push hook already blocks *new* errors in touched files — correct mechanism. Don't big-bang; ratchet.

### LOW
- 56 local / 78 remote branches — quarterly prune.
- `cdn.sanity.io` remnant hostname in `next.config.js` images config (Sanity removed).
- Staging deploys via raw `docker run` + Traefik labels instead of Coolify compose (known fragility; broke once 2026-06-05).

### Healthy — no action
- CI/CD: commit-SHA image verification, two-tier disk guards, Turbopack staging-first rollout, pre-push build-config validation.
- tsconfig `strict: true`; auth architecture and docs (`.claude/rules/auth-patterns.md`) accurate.
- Supabase Security Advisor state already reviewed 2026-06-07 (2 intentional exceptions documented).

---

## Task List

> Effort key: S = <1h · M = 1–4h · L = 1–2 days
> Phase 1 ≈ 1–2 engineering days total. Recommended: ship Phase 1 + Phase 2 as one security/cleanup PR to `staging` → `main`.

### Phase 1 — Critical security (DONE in code 2026-06-11, branch `fix/security-audit-2026-06`)

- [x] **1.1 (S)** `app/api/customers/route.ts` — GET/POST now require a verified session (header token or cookies via `getRequestUser`); the caller can only read/write **their own** record (matched on `auth_user_id`/`email`); `select('*')` replaced with an explicit `CUSTOMER_COLUMNS` list. *(SEC-1)*
- [x] **1.2 (S)** `app/api/customers/ensure/route.ts` — the entire `body.auth_user_id` branch removed; identity comes only from the verified session. Added a 23505 race-recovery on insert. Caller `components/providers/CustomerAuthProvider.tsx` updated to send the session `Authorization` header instead of `auth_user_id` in the body. *(SEC-2)*
- [x] **1.3 (M)** `app/api/webhooks/netcash/emandate/route.ts` — added an **env-gated** shared-secret check: requires `?key=<NETCASH_EMANDATE_WEBHOOK_KEY>` with a constant-time compare. Enforcement only activates once the env var is set, so deploying before NetCash updates the Notify URL does not drop genuine postbacks (clinic-mandate-poll cron remains the backstop). `.env.example` documents the var + required Notify URL. **OPS FOLLOW-UP (console):** generate the key, set it in Coolify, and append `?key=…` to the eMandate Notify URL on the live NetCash profile — only then is enforcement live. *(SEC-3)*
- [x] **1.4 (S)** `app/api/admin/suppliers/route.ts`, `app/api/admin/sync-summary/route.ts`, and `app/api/admin/suppliers/sync/route.ts` — added `authenticateAdmin(request)`. Bonus: `suppliers/sync` interpolated the supplier code into a shell command (command-injection); added a strict `^[A-Za-z0-9_-]+$` validation. *(SEC-4)*
- [x] **1.5 (S)** `app/api/invoices/initiate-payment/route.ts` — now requires admin OR the invoice-owning customer (verified via `customer_invoices.customer_id`). Also fixed a latent `error.message` on `unknown` type. *(SEC-5)*
- [x] **1.6 (M)** Redacted **10 distinct Google API keys across 22 tracked text files** (more than the 7 first sampled — mostly `NEXT_PUBLIC` Maps keys) to `<REDACTED-GOOGLE-API-KEY>`; untracked the accidentally-committed `.playwright-mcp/` test artifacts (106 files, kept on disk) and removed the `.gitignore` force-includes for `test-fish-eagle/`. **OPS FOLLOW-UP (console):** rotate the keys in Google Cloud Console + confirm HTTP-referrer restrictions — redaction does not invalidate keys already in git history. *(SEC-6)*
- [x] **1.7 (S)** Deleted 7 unreferenced junk routes (`test-simple`, `test-email`, `emails/test`, `env-test` [leaked service-key prefix], `quotes/test`, `coverage/debug`, `test/supabase`). Added `lib/api/dev-only-guard.ts` (404 in production) to the 4 still-referenced ones (`payments/test-initiate`, `test/create-order`, `test/zoho-sync/customer`, `zoho/test-connection`). The 3 remaining `admin/*` test routes were already admin-gated. *(SEC-7)*
- [ ] **1.8 (verify)** After deploy to staging: confirm `GET /api/customers?email=…` returns 401, `/api/admin/suppliers` returns 401 unauthenticated, eMandate webhook rejects a bad `?key`, and the customer dashboard still loads (ensure-route caller change).

### Phase 2 — High (this week / same PR)

- [ ] **2.1 (M)** `app/api/webhooks/whatsapp/route.ts` — verify `X-Hub-Signature-256` (HMAC-SHA256 of raw body with the Meta app secret) on POST. *(SEC-8)*
- [ ] **2.2 (M)** `app/api/webhooks/clickatell/delivery/route.ts` — add shared-secret/token validation (Clickatell supports a configurable callback auth token). *(SEC-8)*
- [ ] **2.3 (S)** `npm audit fix` (non-force) → fixes `tmp`, `brace-expansion`. Commit lockfile. *(DEP-1)*
- [ ] **2.4 (M)** `npm audit fix --force` for `serialize-javascript`/`uuid`/`postcss` on a branch → deploy to staging → smoke-test before merging. *(DEP-1)*
- [ ] **2.5 (S)** Delete dead files: `app/admin/sales/feasibility/page.backup.tsx`, `app/admin/orders/page-old.tsx`, `app/api/admin/login/route.backup.ts`. *(CODE-1)*
- [ ] **2.6 (S)** Commit (or explicitly discard) the untracked pages: `app/forms/`, `app/products/cloudwifi/`, `app/services/growth-ready/`, `app/services/mid-size/`, `app/services/security/`, `components/resources/`. *(CODE-2)*

### Phase 3 — Medium (this month, can ride along with feature PRs)

- [ ] **3.1 (M)** Write the admin-route auth guard test: walk `app/api/admin/**/route.ts`, assert each file references `authenticateAdmin` (allowlist: `login`, `logout`, `signup`, `forgot-password`). Add to Jest suite so SEC-4 can never recur. *(TEST-1)*
- [ ] **3.2 (M)** PDF generators: determine which of `lib/quotes/pdf-generator.ts` / `pdf-generator-v2.ts` is imported by live code (`grep -r "pdf-generator"`); delete the orphan or document why both exist. *(CODE-3)*
- [ ] **3.3 (M)** Billing types: migrate imports from `lib/types/billing.ts` → `lib/types/billing.types.ts`; delete legacy file. *(CODE-3)*
- [ ] **3.4 (L)** Finish the backend UI-kit migration: `grep -r "components/shared/StatCard\|components/shared/StatusBadge"` and repoint all direct imports to `components/backend/*` (or the `admin/shared` shims); then delete the legacy `components/shared/` versions. *(CODE-3)*
- [ ] **3.5 (S)** Resolve `components/payment/` vs `components/payments/` and check whether `lib/services/supabase.ts` is a shim or a 4th client factory — consolidate. *(CODE-3)*
- [ ] **3.6 (M)** Add unit tests for activation logic and the admin login route (currently only `route.backup.ts` artifacts). *(TEST-1)*
- [ ] **3.7 (M)** Sweep `console.log` → `apiLogger` in `app/api` + `lib` (555 instances; do it per-domain alongside feature PRs rather than one mega-diff). *(TYPE-1)*
- [ ] **3.8 (S)** Add rate limiting to the now-authenticated public endpoints (`/api/customers`, `/api/invoices/initiate-payment`) and webhooks.

### Phase 4 — Low / quarterly hygiene

- [ ] **4.1 (S)** Prune merged local/remote branches (56 local, 78 remote).
- [ ] **4.2 (S)** Remove `cdn.sanity.io` from `next.config.js` image hostnames.
- [ ] **4.3 (M)** Migrate staging deploy from raw `docker run` to Coolify compose (align with prod) or add a post-deploy routing health check to `deploy-staging.yml`.
- [ ] **4.4 (M)** One-paragraph service-layer guide in `docs/architecture/` (which billing/notification service is canonical, when to extend vs create).
- [ ] **4.5 (S)** Triage the 106 TODO/FIXME markers — convert real ones to issues, delete stale ones.
- [ ] **4.6 (M)** Extend the pre-push hook ratchet to flag new `: any` in touched files (optional).
- [ ] **4.7 (S)** Update `docs/TECHNICAL_DEBT_REGISTER.md` (last updated 2026-02-09) with the items above, or mark it superseded by this audit.

---

## Suggested PR plan

1. **PR A — `fix/security-audit-2026-06`** (Phase 1 + 2.1–2.3, 2.5–2.6): auth guards, webhook verification, key redaction, test-route removal, dead-file deletion, untracked-page commit, safe `npm audit fix`. ~10–12 files. Push to `staging` first, verify §1.8, then PR to `main`.
2. **PR B — `chore/dep-force-fixes`** (2.4): force dependency bumps, staging-soak before merge.
3. **PR C+ —** Phase 3 items individually or alongside related feature work.

Key rotation (1.6) is console work, not a PR — do it the same day PR A merges so old keys die with the redaction.

---

*Related: `docs/TECHNICAL_DEBT_REGISTER.md` (2026-02-09, partially superseded), `docs/audits/2026-03-03-frontend-design-audit.md`, Supabase advisor exceptions memo (2026-06-07).*
