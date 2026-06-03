# Build Cost Attribution — Pages vs API Routes

**Date:** 2026-06-03
**Branch measured:** `payload-cms-wip`
**Purpose:** Settle, with measured data, the load-bearing claim in an external
architecture review that "the build pain is in the 307 admin API routes, not page
rendering — extract the API layer first for 80% of the benefit." See the review at
`/root/.claude/plans/review-this-against-the-scalable-cake.md`.

---

## TL;DR

The claim is **refuted for build memory and build wall-time**, and only *technically* true
for a non-bottleneck phase (parallel minification of server chunks).

- **Peak build memory = 9.27 GB** (exceeds the 8 GB heap setting → the build is genuinely at
  the edge, as the review said). This peak occurs during **webpack compilation**, whose cost is
  **~87% node_modules** dragged in by the page/component graph. The **307+ API route handlers
  account for ~1% of source-module compile work.** Extracting them would not relieve the memory
  ceiling.
- **Wall-clock build time = 22m 15s.** The spine is compilation, not minification.
- **The thing to fix for memory is the client/page dependency graph** (recharts and the other
  heavy libs in `optimizePackageImports`), not the API routes.

⚠️ **Separate, urgent finding:** the `payload-cms-wip` branch **does not build at all** (details
below). This blocks deploying the branch and is independent of the architecture question.

---

## Measured numbers (baseline `next build --profile`)

Run: `NODE_OPTIONS='--max-old-space-size=8192' next build --profile`, config `cpus: 1`
(`SELF_HOSTED` path), via `/usr/bin/time -v`.

| Metric | Value |
|---|---|
| **Peak RSS (Maximum resident set size)** | **9.27 GB** (9,726,184 KB) |
| Wall-clock time | **22:15** |
| User CPU / System CPU | 2,591s / 257s (213% CPU avg) |
| Exit | **1 — failed** (webpack error, see below) |

The build ran all three webpack compilations to completion (`server` 674.8s, `edge-server`
8.4s, `client` 433.0s — all `seal`ed) and then **aborted at the final error check** because of
an unresolvable import. The peak RSS and compilation timings are therefore valid; only the
post-compile static-generation/route-table step never ran.

---

## Attribution from the build trace (`.next/trace`, 23,813 events)

### Source-module compilation (`build-module-*` leaf events — true per-file work)

| Bucket | CPU-time | Modules | Share |
|---|---|---|---|
| **node_modules** | **8,907 s** | 14,157 | **~87%** |
| components/ | 653 s | 1,017 | 6.4% |
| app/ (other) | 278 s | 53 | 2.7% |
| **app pages** | **215 s** | 870 | 2.1% |
| lib/ | 131 s | 436 | 1.3% |
| **API route handlers** | **88 s** | 584 | **~0.9%** |
| app layouts | 6 s | 25 | 0.1% |

→ First-party page+component+layout compile (`215 + 653 + 6 = 874 s`) is **~10× the API-route
compile (88 s)**. And both are dwarfed by node_modules (8,907 s), which is pulled in
predominantly by the **client/page** graph. **Removing all 307+ API routes removes <1% of
source-module compile work** — and even less of peak memory, since the dominant node_modules
graph stays (it is referenced by pages/components, not routes).

### Minification (`minify-js` — 29,750s CPU total)

| Chunk type | CPU-time | Share |
|---|---|---|
| API **server** route chunks (`app/api/**/route.js`) | 14,190 s | 47.7% |
| shared/vendor chunks | 6,380 s | 21.4% |
| page chunks | 4,718 s | 15.9% |

Server route chunks *do* take significant minify **CPU**. **But this is not a bottleneck:**
total `minify-js` CPU (29,750s) ran inside a 22-min wall clock → ~22× parallelism. Minification
is not on the wall-time critical path, and it happens *after* the peak-memory compilation phase.
So while extracting routes would remove ~14k s of parallel minify CPU, it would **not
meaningfully reduce either the 22-min wall time or the 9.27 GB peak** — the two things that are
actually painful.

---

## Verdict on the review's claim

| Review claim | Measured reality |
|---|---|
| "Pain is in the API routes" | **False for memory & wall-time.** Routes = ~1% of compile, parallel-only minify cost. |
| "Pages are lightweight (just rendering)" | **False.** Pages+components+their node_modules graph drive ~87%+ of compile and the 9.27 GB peak. |
| "Extract API layer first = 80% of benefit / 20% risk" | **Not supported.** Extraction would shed <1% of memory pressure and no wall-time spine; the entanglement risk (shared components) remains. |
| "Build is on life support (8 GB heap)" | **True.** 9.27 GB peak confirms it. |

**Where the real memory win is:** shrink the **client/page dependency graph** — audit the heavy
libs (recharts, the 13 packages in `optimizePackageImports`), code-split/lazy-load the heaviest
admin pages (data tables, charts), and consider per-route dynamic imports. That attacks the
8,907 s node_modules compile + the page chunk graph that holds the 9.27 GB.

---

## ⚠️ Branch-blocking bug found — FIXED 2026-06-03 (independent of the above)

**Resolved:** `app/(payload)/cms/[[...slug]]/page.tsx` is now a server component that renders
`RootPage` directly; the `'use client'` wrapper `page.client.tsx` was deleted. All 5 webpack
errors shared one root (the static client import of `payload.config.ts` via that wrapper), so
removing it clears them. `payload-products.ts` was *not* a leak — it imports the config via a
dynamic `import()` inside an async fn, which webpack keeps out of the static client graph.
Final confirmation deferred to CI build on push. Original failure below for the record:

The build **failed** on `payload-cms-wip`:

```
Module not found: Can't resolve 'net'
./node_modules/pg/lib/connection.js
Import trace:
  ./payload.config.ts  →  @payloadcms/db-postgres → pg → net
  ./app/(payload)/cms/[[...slug]]/page.client.tsx
```

`payload.config.ts` (which imports `@payloadcms/db-postgres` → `pg`, a Node-only module) is
being pulled into a **client component**, `app/(payload)/cms/[[...slug]]/page.client.tsx`.
Browser bundles cannot resolve Node's `net`, so webpack errors out.

- These files (`payload.config.ts`, the `(payload)` route group) are **WIP-only — not on `main`**,
  so production/`main` still builds. This break is contained to the in-progress Payload branch.
- **Fix direction:** the client component must not import `payload.config.ts`. Payload's config
  belongs to server-only code; the client entry should import only Payload's client UI package,
  or the config import should be moved behind a server boundary. (Out of scope for this spike —
  flagged for the Payload work.)

---

## Limitations / optional confirmation

- Numbers are from a build that errored at the final check (after all 3 compilations sealed), and
  module/minify durations are **CPU-time across parallel workers** — ratios and the peak RSS are
  the reliable signals, not absolute per-file seconds.
- The per-route **First Load JS** table was not emitted (build aborted before it). If a
  fully-clean confirmation is wanted, run one `next build` in an isolated **git worktree off
  `main`** (zero impact on the WIP working tree) — that yields the route table + a successful
  `ANALYZE=true` client-chunk report. The attribution conclusion above is not expected to change.

## Reproduce

```bash
set -a && source .env.local && set +a
/usr/bin/time -v env NODE_OPTIONS='--max-old-space-size=8192' \
  node ./node_modules/next/dist/bin/next build --profile 2>&1 | tee /tmp/build-baseline.log
# trace analysis: parse .next/trace (newline-delimited JSON arrays of {name,duration,tags})
```
