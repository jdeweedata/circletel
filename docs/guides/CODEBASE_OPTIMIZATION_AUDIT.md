# CircleTel Codebase Optimization Audit

**Date**: 2026-07-19
**Scope**: Full codebase — tech stack, all pages, API/data layer, build & deploy pipeline
**Method**: Three parallel deep-exploration passes (tech stack/build config, pages/components, API/data layer), with the highest-impact findings verified line-by-line against the actual source.
**Deliverable**: Audit only — no code changes were made. Each finding includes evidence, expected impact, and an effort estimate (S = hours, M = days, L = a week+).

---

## Executive Summary

CircleTel is substantially larger than the documented "254-page app":

| Metric | Actual |
|---|---|
| Pages (`page.tsx`) | **350** |
| API route handlers (`route.ts`) | **608** |
| Components | **700** |
| TypeScript files (app + components + lib) | 2,692 |
| Lines of code (app + components + lib) | ~530,000 |
| Admin share | 170 pages (49%), 335 API routes (55%), 238 components (34%) |

**The five findings that matter most:**

1. **There is no caching layer anywhere** — every request recomputes everything, including the public coverage-check hot path which runs 7 sequential database queries per hit. (→ H1)
2. **The app is client-rendered where it should be server-rendered** — 90% of admin pages and most public marketing pages are `'use client'`, producing fetch waterfalls and blocking SEO metadata on customer-facing pages. (→ H2)
3. **Row Level Security is bypassed by default** — 584 files use the service-role Supabase client vs 66 using the RLS-respecting session client; one missing `.eq()` filter anywhere in those 584 files is a data leak with no backstop. (→ H4)
4. **No quality gate blocks anything** — builds ignore type and lint errors (~295 pre-existing type errors), all CI checks are `continue-on-error`, and auto-merge is enabled. (→ H6)
5. **Meaningful dead weight ships to production** — backup pages, demo routes, redundant dependency pairs, an unused icon library, and 6–8 MB source images. (→ M1, M4, M8)

**Bright spots worth protecting** (found and verified — do not regress these):

- **Admin API auth is centralized and near-universal**: `lib/auth/admin-api-auth.ts` is imported by 338 files; only 3 admin routes lack auth and all 3 are legitimately public (login, signup, forgot-password).
- **No hardcoded secrets** and no sensitive values behind `NEXT_PUBLIC_` — targeted greps for key patterns came back clean.
- **Strong database indexing**: 896 `CREATE INDEX` statements, plus a dedicated PostGIS optimization migration (`supabase/migrations/20260714195733_optimize_postgis_spatial_queries.sql`) with STORED geography columns matched to GiST indexes.
- **`next/image` is well established**: 43 files use it. (An earlier draft claimed raw `<img>` appeared in only 2 files — a single-line grep that missed multi-line JSX; the real count is 37 files, see M8.)
- **Clean order-flow architecture**: `components/order/context/OrderContext.tsx` is a compact 262-line reducer store — the best-factored area reviewed.
- **Well-tuned self-hosted CI**: Turbopack builds (~10 min vs 17–21 min webpack), tar-based `node_modules` cache, rsync'd `.next` cache.

---

## High-Priority Findings

### H1. No server-side caching at all; the public coverage hot path runs 7 sequential queries

**Evidence:**
- `unstable_cache`: 0 uses. React `cache()`: 0 uses. Redis/Upstash: 0 uses.
- `export const revalidate`: only 8 occurrences app-wide. `force-dynamic`: 116 occurrences.
- `app/api/coverage/packages/route.ts` (524 lines) — the endpoint behind the public coverage check — executes sequential `await supabase.from(...)` queries at lines 123, 248, 267, 303, 341, 361, and 446 with **no `Promise.all` and no caching** on the DB reads.
- The external-provider aggregation it calls is **already cached**: `lib/coverage/aggregation-service.ts` has a 5-minute in-memory `Map` cache with pending-request deduplication (lines 55–58, 904–917), and the MTN WMS client keeps its own cache. The gap is the **7 uncached database reads around it** — and the existing cache is per-process (effective on the long-lived Coolify standalone container; per-instance only on Vercel functions).

**Impact:** Every coverage check pays serialized latency for 7 DB round-trips even when the provider aggregation is a cache hit. Reference data queried on this path (`coverage_areas`, `service_type_mapping`, `service_packages`) changes rarely and is highly cacheable. This endpoint is on the conversion-critical customer journey.

**Recommendation:**
- First measure: log/expose the aggregation service's existing cache hit rate (`getCacheStats()` already exists at line ~968) before adding anything — don't rebuild a cache that exists.
- Parallelize independent DB queries with `Promise.all`.
- Wrap the **DB reference-data reads** (`service_packages`, `coverage_areas`, `service_type_mapping`) in `unstable_cache` with a 5–60 min revalidate. **Important:** `unstable_cache` does not invalidate on writes — the same change must add `revalidateTag()` calls to the admin routes that edit these tables (e.g. package management under `app/api/admin/products/`), or admins will see stale coverage data after edits. Ship cache + invalidation together, not as a follow-up.
- Audit the 116 `force-dynamic` files — many are dynamic only out of habit.

**Effort:** M (hot path first: S — one file, measurable immediately)

---

### H2. Client-component overuse: fetch waterfalls and lost SEO on public pages

**Evidence:**
- ~320 `'use client'` files in `app/` (153 of 170 admin pages = 90%; 16 of 20 dashboard pages).
- **186 pages** fetch data via `useEffect` + `fetch('/api/...')` (client waterfall) vs only **26 async server components** — a 7:1 ratio.
- Public marketing pages that are fully client-rendered and therefore **cannot export `metadata`**: `app/pricing/page.tsx`, `app/deals/page.tsx`, `app/contact/page.tsx`, `app/products/page.tsx`, `app/services/page.tsx`, `app/wireless/page.tsx`, `app/connectivity/page.tsx`, `app/cloud/page.tsx`, `app/(marketing)/5g-deals/page.tsx`, `app/(marketing)/enterprise/page.tsx`.
- Only **53 of 350 pages** export `metadata`/`generateMetadata` (~15%).
- Counter-examples done right: `app/packages/page.tsx`, `app/faq/page.tsx`, `app/blog/page.tsx`, `app/business/page.tsx`.

**Impact:** Slower first paint (empty shell → JS download → fetch → render), larger client bundles, and — most costly for a B2B/B2C ISP acquiring customers organically — **no per-page title/description/OG tags on the main marketing surface**. Given the business context (consumer channel is organic-only), the SEO cost is a direct revenue issue.

**Recommendation:**
1. Convert the 10 public marketing pages above to server components with `metadata` exports first (highest SEO leverage, lowest risk — most are mostly-static content with small interactive islands that can stay client components).
2. For admin/dashboard, adopt the pattern already proven in `app/admin/customers/[id]/statement/page.tsx` and `app/services/[slug]/page.tsx`: async server component fetches, client child components for interactivity.

**Effort:** Marketing pages: M. Admin migration: L (incremental, page-by-page)

---

### H3. Middleware does a database read on every protected `/admin` request

**Evidence:** `middleware/admin-auth.ts` performs an `admin_users` select on each protected admin **page** request (lines 125–128). The code itself flags this: *"one admin_users read per protected admin request. Upgrade path is a JWT app_metadata.admin_role claim (zero-DB)."* Scope note: the middleware predicate is `pathname.startsWith('/admin')` (`isAdminRoute`, line 37), so `/api/admin/*` routes never reach this read — but they pay an equivalent per-request `admin_users` read inside `authenticateAdmin()` (`lib/auth/admin-api-auth.ts:103`) instead.

**Impact:** One DB round-trip of latency on every admin page navigation (middleware), and one on every admin API call (`authenticateAdmin`). With the client-side fetch waterfalls from H2, a single admin page load pays the middleware read once plus the auth-helper read on each API fetch it triggers.

**Recommendation:** Implement the upgrade path already identified in the code: stamp `admin_role` into JWT `app_metadata` on login/role change, verify the claim with zero DB access in **both** layers — middleware and `authenticateAdmin()` — and keep the DB check only as a fallback or for sensitive mutations.

**Effort:** M

---

### H4. Service-role (RLS-bypassing) Supabase client is the default server client

**Evidence:** `lib/supabase/server.ts:14` — `createClient()` uses `SUPABASE_SERVICE_ROLE_KEY` (verified). Import counts:

| Client | Files | RLS |
|---|---|---|
| `createClient()` from `@/lib/supabase/server` | **584** | **Bypassed** |
| `createClientWithSession()` (anon key + cookies) | 66 | Respected |

**Impact:** Data isolation across the entire server codebase rests on manual `.eq('user_id', ...)`-style filters. A single missing filter in any of 584 files exposes other customers' data with no RLS backstop. Compounding footgun: the service-role factory has the **same name** (`createClient`) as the RLS-respecting browser client in `lib/supabase/client.ts`, so a copy-paste or wrong import silently escalates privileges. `.claude/rules/auth-patterns.md` documents service-role as intentional for admin/background work — the risk is user-facing routes (portal, dashboard, customer, orders) inheriting it as the path of least resistance.

**Recommendation:**
1. Rename the service-role factory to something explicit (e.g. `createServiceRoleClient()`), keeping a deprecated alias during migration — makes every RLS bypass visible and greppable. With 584 call sites this is high blast-radius by definition, so scope the first PR to **only** the rename + deprecated alias + CI guard with zero behavior change — reviewable and revertible independently of any route migration.
2. Audit user-facing (non-admin, non-cron) API routes among the 584 and migrate those handling per-user data to `createClientWithSession()` — as separate, per-area PRs after the rename lands.
3. Add a lint rule or CI grep blocking new service-role imports outside `app/api/admin`, `app/api/cron`, `lib/inngest`.

**Effort:** Rename + guard: S. Route audit/migration: L (prioritize `app/api/dashboard`, `app/api/orders`, portal routes)

---

### H5. 145 API routes leak internal error details to clients

**Evidence:** 145 routes return `error.message` / `err.message` / `JSON.stringify(error)` directly in JSON responses. 584 of 608 routes have consistent `try/catch` structure, so the fix surface is uniform.

**Impact:** Database error text, constraint names, and internal service messages reach clients — an information-disclosure aid to attackers and a source of confusing UX.

**Recommendation:** Introduce a shared API error responder (log full error server-side via the existing `lib/logging` logger, return a generic message + correlation ID — the middleware already sets `x-request-id`). Migrate routes mechanically. Since this touches all 145 routes anyway, it's also the natural moment to normalize inconsistent HTTP status codes through the same helper (optional scope addition).

**Effort:** Helper: S. Migration: M (mechanical, scriptable)

---

### H6. No quality gate blocks a broken merge

**Evidence:**
- `next.config.js`: `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`.
- `.github/workflows/pr-checks.yml`: type-check, lint, and build jobs all `continue-on-error: true`.
- `auto-merge.yml` auto-merges approved PRs.
- ~295 pre-existing type errors (documented in `.githooks/pre-push`); the pre-push hook's scoped check is the *only* type enforcement, and it's client-side with escape hatches (`--no-verify`, `SKIP_TYPECHECK=1`).
- Jest coverage thresholds exist but `collectCoverageFrom` only covers `lib/payments`, `lib/types`, `app/api/payments`; jest does not run in the standard PR gate at all.

**Impact:** A PR that fails type-check, lint, build, *and* tests can still auto-merge to `main` and deploy. The 295-error baseline grows silently.

**Recommendation:**
1. Snapshot the current error count as a baseline and add a **ratchet job** to pr-checks (fail if count increases) — the repo already has this exact pattern working in `brand-literal-ratchet` (baseline 6182 in `.brand-literal-baseline`); reuse it.
2. Make the *build* job blocking immediately — this requires **two** changes, not one: remove `continue-on-error: true` from the job AND remove the `|| true` inside the build step itself (`pr-checks.yml:131` runs `npm run build:ci || true`, so flipping the job to required alone would still pass failed builds).
3. Burn down the 295 errors incrementally; flip `ignoreBuildErrors` off at zero.

**Effort:** Ratchet + blocking build: S. Error burn-down: L (background task)

---

## Medium-Priority Findings

### M1. Dependency redundancy and dead weight (verified in `package.json`)

102 dependencies + 26 devDependencies. Confirmed overlaps:

| Issue | Detail | Action |
|---|---|---|
| Two Google GenAI SDKs | `@google/genai` (1 file) + `@google/generative-ai` (4 files) | Consolidate to `@google/genai` (the successor SDK) |
| Two chart libraries | `recharts` (22 files) + `chart.js`/`react-chartjs-2` (**1 file**: `app/admin/quotes/[id]/analytics/page.tsx`) | Port 1 file to recharts, drop 2 deps |
| Two drag-and-drop stacks | `@dnd-kit/*` (3 files) + `@hello-pangea/dnd` (1 file) | Consolidate on @dnd-kit |
| Unused icon library | `@iconify/react` — **0 usages** in app/components/lib | ⚠️ `.claude/rules/icon-system.md` designates Iconify for brand logos — decide: adopt it per the rule, or remove until needed. Don't remove blindly. |
| Unmaintained PWA plugin | `next-pwa@5.6.0` on Next 15/React 19 | Replace with `@ducanh2912/next-pwa` or Serwist, or drop PWA |
| Peer-dep workaround | `.npmrc` `legacy-peer-deps=true` forced by `next-themes@0.3` vs React 19 | Upgrade next-themes (v0.4+ supports React 19), remove the flag |
| Dead config entries | 5 uninstalled packages listed in `experimental.optimizePackageImports` (`lucide-react`, `@phosphor-icons/react`, `@tabler/icons-react`, `@tanstack/react-table`, `motion`) | Delete the entries |
| Two headless-browser stacks | `puppeteer-core` + `@sparticuz/chromium-min` in deps AND Playwright + Alpine chromium in Dockerfile | Standardize server-side PDF/scrape work on one |

**Effort:** S–M (each row independent; all low-risk)

### M2. Component duplication with a weak shared layer

- **4 ProductCard implementations**: `components/products/ProductCard.tsx`, `components/hardware/ProductCard.tsx`, `components/admin/products/AdminProductCard.tsx`, `components/admin/products/shared/UnifiedProductCard.tsx` (the "Unified" name shows a consolidation attempt that never removed the others).
- **3 PackageCard implementations**; **~12 per-domain Hero components** alongside a generic `blocks/HeroBlock.tsx`; **3× each** of `StatusBadge.tsx`, `StatCard.tsx`, `SectionCard.tsx`, `InfoRow.tsx`; 60 `*Card`, 18 `*Modal`, 16 `*Table` files overall.

**Recommendation:** Finish the started consolidations first (UnifiedProductCard, HeroBlock) — delete the superseded variants rather than adding abstractions. `.claude/rules/admin-shared-components.md` already documents the shared admin prop interfaces.
**Effort:** M (incremental)

### M3. God files

Top offenders (all client components):

| Lines | File |
|---|---|
| 2,202 | `app/admin/b2b/manual-intake/page.tsx` |
| 2,081 | `app/admin/unjani/onboarding/page.tsx` |
| 1,487 | `app/admin/sales/feasibility/page.tsx` |
| 1,379 | `app/admin/sales/feasibility/components/SingleSiteStepper.tsx` |
| 1,347 | `app/admin/quotes/new/page.tsx` |
| 1,332 | `app/admin/b2b/vetting/[submissionId]/page.tsx` |
| 1,171 | `components/business-dashboard/site-details/SiteDetailsForm.tsx` |

Largest API routes: `app/api/webhooks/netcash/emandate/route.ts` (712), `app/api/payments/netcash/webhook/route.ts` (673), `app/api/admin/orders/[orderId]/activate/route.ts` (645), `app/api/cron/submit-debit-orders/route.ts` (633).

**Recommendation:** Decompose opportunistically — only when a file is already being changed. Not worth a dedicated refactor sprint.
**Effort:** L (spread over time)

### M4. Dead code shipping to production

Confirmed committed artifacts:
- `app/admin/sales/feasibility/page.backup.tsx` — **1,419 lines**, near-duplicate of the live page beside it
- `app/admin/orders/page-old.tsx`
- `app/api/admin/login/route.backup.ts` — a **backup of an auth route** is also a security-surface concern
- ~9 test/demo/prototype routes shipped: `app/test/`, `app/demo/`, `app/prototype/`, `app/broadband-demo/`, `app/cms-demo/`
- `components/sidebar-demo.tsx`, `components/sidebar-demo-refactored.tsx`

**Recommendation:** Delete the backups outright (git history preserves them). Gate or delete demo routes.
**Effort:** S

### M5. App Router conventions unused: no loading/error boundaries, no code splitting

- **0 `loading.tsx`**, **0 `error.tsx`** files in the entire app; only 4 `not-found.tsx`. Only 23 pages use `<Suspense>`.
- **3 files** use `next/dynamic`; 0 use `React.lazy` — no manual code splitting across 700 components.

**Impact:** No streaming skeletons (blank screens during navigation), no route-level error recovery (a render error white-screens the route), and heavy components (charts, maps, PDF viewers) load in the initial bundle.

**Recommendation:** Add `loading.tsx` + `error.tsx` at the top-level route groups first (`app/admin`, `app/dashboard`, `app/order`, root). Dynamic-import chart/map/PDF components (recharts alone appears in 22 files).
**Effort:** S for boundaries, M for splitting

### M6. Query hygiene: unbounded lists, `select('*')`, N+1 surface

- `select('*')`: **393 uses** (per the pinned command in Measurement) — including all four tables on the coverage hot path.
- Only 125 `.limit()` and 45 `.range()` calls across 608 routes — many list endpoints are unbounded and will degrade as tables grow.
- 514 loop-with-await sites (`for (const` / `.map(async` / `.forEach(async`) in `app/api` + `lib` — a large N+1 risk surface.

**Recommendation:** Add `.limit()` to admin list endpoints (largest tables first: orders, invoices, leads); replace `select('*')` with explicit columns on hot paths; spot-audit loop-await sites in cron/reconciliation jobs.
**Effort:** M

### M7. 1,920 raw `console.*` calls despite a structured logger

`lib/logging` (`apiLogger`, `CoverageLogger`) exists but raw console dominates. Correlation IDs (`x-request-id`) are already generated in middleware yet unused in most log output.
**Recommendation:** Enforce via ESLint `no-console` (warn → error over time); migrate hot paths first.
**Effort:** M (mechanical)

### M8. 6–8 MB source images in `public/`; 37 files still use raw `<img>`

Eight hero JPGs at 6–8 MB each (e.g. `public/images/entertainment/entertainment-hero.jpg` 7.9 MB, `public/images/workconnect-mobile-bundle-hero.jpg` 7.5 MB, `public/images/products/business-complete-hero.jpg` 7.3 MB) plus 2–3 MB files in `public/generated-images/`. `next/image` optimizes delivery where it's used, but these bloat the repo, Docker image, and every CI build/deploy rsync.

Additionally, **37 files render raw `<img>` tags** (`grep -rl "<img" app components --include='*.tsx'`) and get **zero** automatic optimization/resizing — including customer-facing surfaces (`app/blog/[slug]/page.tsx`, `app/order/consumer/page.tsx`, `components/hardware/ProductCard.tsx`, `components/blog/PostCard.tsx`, `components/ui/enhanced-package-card.tsx`) alongside many admin pages. Where a raw `<img>` renders one of the oversized source images above, the full multi-MB file ships to the browser.

**Recommendation:** Re-encode the source images to ≤300 KB WebP/AVIF at realistic max display size, and migrate the customer-facing raw `<img>` usages to `next/image` first (admin pages can follow opportunistically).
**Effort:** S for re-encoding; S–M for the img migration

---

## Low-Priority Findings

| # | Finding | Recommendation |
|---|---|---|
| L1 | Node version mismatch: `.nvmrc` = v22.14.0, CI/Docker = Node 20 | Align on one LTS (20 or 22) everywhere |
| L2 | Route groups `(marketing)`/`(dashboard)` exist but hold only 6 pages; most public/dashboard pages sit outside them | Consolidate when touching those pages; enables group-level layouts/loading/error boundaries |
| L3 | Payments API split across 4 sibling groups: `payments/`, `payment/`, `pay/`, `paynow/` (two near-identical NetCash webhook handlers: `app/api/payments/netcash/webhook/route.ts` 673 lines and `app/api/payment/netcash/webhook/route.ts` 546 lines) | Verify which webhook NetCash actually calls; deprecate the other |
| L4 | `@next/bundle-analyzer` is v16 (Next is v15); `npm run analyze` wired but no evidence it's used | Pin to matching major; run it once — with essentially no code splitting (M5), the first report will be informative |
| L5 | ISR unexploited: `blog/[slug]`, `locations/[town]`, `services/[slug]` are content-shaped but only 8 files use `revalidate`, 9 use `generateStaticParams` | Add ISR to content routes for CDN-cacheable pages |
| L6 | Payment endpoints have per-route memory/duration overrides in `vercel.json` (up to 600 s) alongside 23 crons — dual-hosting (Vercel + Coolify) doubles config surface | Document which platform owns which cron to avoid double-execution |

---

## Suggested Roadmap

Sequenced for impact-per-effort; each phase is independently shippable.

### Phase 1 — Quick wins (days)
1. Delete dead files: backups, `page-old`, demo routes, sidebar-demo components (M4)
2. Remove/consolidate redundant deps; delete dead `optimizePackageImports` entries; upgrade `next-themes` and drop `legacy-peer-deps` (M1)
3. Re-encode the 8 oversized hero images (M8)
4. Align Node versions (L1)
5. Add type-error **ratchet** to pr-checks (reuse the brand-literal-ratchet pattern) and make the build job blocking — both `continue-on-error` and the step's `|| true` (H6, part 1)

### Phase 2 — Performance (1–2 weeks)
6. Coverage hot path: `Promise.all` + `unstable_cache` on reference data (H1)
7. JWT `app_metadata` claim for admin middleware auth — the code's own documented upgrade path (H3)
8. `loading.tsx`/`error.tsx` at top route groups; dynamic-import recharts/maps/PDF components (M5)
9. Convert the 10 public marketing pages to server components with `metadata` (H2, part 1)

### Phase 3 — Safety (2–4 weeks, incremental)
10. Rename service-role client to `createServiceRoleClient()`; add CI guard on new imports; migrate user-facing routes to session client (H4)
11. Shared API error responder; migrate the 145 leaking routes (H5)
12. `.limit()` on unbounded admin lists; explicit columns on hot paths (M6)
13. Type-error burn-down toward flipping `ignoreBuildErrors` off (H6, part 2)

### Phase 4 — Structural (ongoing, opportunistic)
14. Component consolidation — finish UnifiedProductCard/HeroBlock migrations (M2)
15. God-file decomposition when files are touched anyway (M3)
16. Admin page server-component migration, page-by-page (H2, part 2)
17. ISR on content routes (L5); console→logger migration with `no-console` lint (M7)

---

## Measurement

To make improvements verifiable rather than anecdotal:

- **Before Phase 2**: run `npm run analyze` once and record First Load JS for the top 10 routes; record TTFB for `/api/coverage/packages` (p50/p95).
- **Ratchet numbers to track** — these counts are scope-sensitive, so each baseline below was captured with the exact command shown (run from repo root); always re-measure with the same command:

| Metric | Baseline | Command |
|---|---|---|
| TypeScript errors | ~295 | `npm run type-check:memory` (count from output; per `.githooks/pre-push`) |
| `select('*')` | 393 | `grep -rF "select('*')" app lib --include='*.ts' --include='*.tsx' \| wc -l` |
| `console.*` calls | 1,915 | `grep -rE "console\.(log\|error\|warn\|info\|debug)\(" app lib --include='*.ts' --include='*.tsx' \| wc -l` |
| `'use client'` pages | 271 | `grep -rlE "^['\"]use client['\"]" app --include='page.tsx' \| wc -l` |
| `'use client'` files (app/) | 320 | `grep -rlE "^['\"]use client['\"]" app --include='*.tsx' --include='*.ts' \| wc -l` |
| `force-dynamic` | 116 | `grep -rF "dynamic = 'force-dynamic'" app --include='*.ts' --include='*.tsx' \| wc -l` |

- **After each phase**: re-run the same commands; the ratchet numbers should only go down.
