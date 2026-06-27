# Design: Rectron Catalogue Auto-Sync

**Date:** 2026-06-27
**Author:** Jeffrey + Claude Code
**Status:** Approved (design) — pending implementation plan

## Problem

CircleTel periodically needs Rectron's distributor product catalogue to build CircleTel
products and solutions. Today the catalogue lands in the database only when a human
manually downloads the price-list `.xlsm` from the RectronZone reseller portal and drops
it into a watch directory. We want this to happen automatically on a schedule.

## Key finding (scope reducer)

Almost all of the pipeline already exists and is reused unchanged:

| Already built | Location |
|---|---|
| `RECTRON` supplier record (metadata: watch dir, file pattern) | `supabase/migrations/20260523000001_add_rectron_supplier.sql` |
| `.xlsm` parser (ExcelJS, sheet `RECTRON_PRICE_LIST`) | `lib/suppliers/rectron/rectron-parser.ts` |
| Sync: parse latest local file → upsert `supplier_products` → write `supplier_sync_logs` | `lib/suppliers/rectron/rectron-sync.ts` |
| Daily Inngest cron `0 0 * * *` (2am SAST) running MiRO/Nology/Scoop | `lib/inngest/functions/supplier-sync.ts` |

**The only missing piece is getting the latest `.xlsm` onto disk automatically.**

The existing code comments assume the portal is CAPTCHA-protected and requires manual
download. Verification on 2026-06-27 disproves this for the data we need:

1. The **public** download page (`https://www.rectronzone.co.za/rectron/downloadzone`,
   no login) contains the exact current filename in a clean table cell:
   `<td>RECTRON_PRICE_LIST_20260626_0733.xlsm</td>` — exactly one such filename appears.
2. The storefront7 CDN serves that file **directly with no authentication**:
   `https://content.storefront7.co.za/stores/za.co.storefront7.rectron/pricelists/<filename>`
   returned HTTP 200, `application/zip`, valid xlsx (`PK\x03\x04` zip header), range-supported.

**Consequence:** No credentials are needed or stored. The supplied Rectron username/password
are not used by this design (better security posture). If Rectron later gates the page behind
login, an authenticated flow can be added then.

## Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| Authentication | No auth — scrape public page + download from public CDN |
| Scope | Catalogue sync only (raw data into `supplier_products`); auto-building CircleTel products/solutions is a separate follow-up |
| Schedule | Daily, wired into the existing supplier-sync Inngest cron (2am SAST) |

## Architecture

One new component plus two integrations into existing files (a small change to the Rectron
sync, and a de-drift of the cron onto the existing orchestrator).

### New: `lib/suppliers/rectron/rectron-downloader.ts`

Single responsibility: ensure the latest Rectron price-list file is present in the watch
directory and return its path. Stateless, no credentials, independently testable.

```
resolveLatestRectronFile(config?): Promise<{ filename: string; url: string }>
  - fetch DOWNLOAD_PAGE_URL (public)
  - extract filename via FILENAME_RE; throw if no match
  - build url = CDN_BASE + filename
  - return { filename, url }

downloadRectronPricelist(options?): Promise<{ filePath: string; filename: string; downloaded: boolean }>
  - resolve latest { filename, url }
  - targetPath = join(watchDir, filename)
  - if exists(targetPath): return { filePath: targetPath, filename, downloaded: false }   // idempotent skip
  - ensure watchDir exists (mkdir -p)
  - stream download to a temp file in watchDir
  - validate: first bytes === PK zip header AND size >= MIN_BYTES
  - atomic rename temp → targetPath  (parser never sees a partial file)
  - on any failure: unlink temp, throw
  - return { filePath: targetPath, filename, downloaded: true }
```

Constants (overridable via `supplier.metadata`, mirroring existing `watch_dir`/`file_pattern`):

- `DOWNLOAD_PAGE_URL = 'https://www.rectronzone.co.za/rectron/downloadzone'`
- `CDN_BASE = 'https://content.storefront7.co.za/stores/za.co.storefront7.rectron/pricelists/'`
- `FILENAME_RE = /RECTRON_PRICE_LIST_\d{8}_\d{4}\.xlsm/`
- `MIN_BYTES = 10_000` (sanity floor; real file is hundreds of KB)
- Metadata override keys (optional): `download_page_url`, `cdn_base_url`

### Integration 1: `lib/suppliers/rectron/rectron-sync.ts`

Add a `download?: boolean` option to `syncRectronProducts` (default `true`).

- When `download` is enabled: call `downloadRectronPricelist()` first and use its returned
  `filePath` as the file to parse.
- When the downloader throws: log a warning, fall back to the existing
  `findLatestFile(watchDir, filePattern)` over already-downloaded local files, and record the
  warning text in the sync log. If no local file exists either, the existing
  `No files matching "..."` error surfaces unchanged.
- When `download` is `false` or an explicit `file_path` is passed: behaviour is exactly as today
  (used by tests and manual local runs).

### Integration 2: `lib/inngest/functions/supplier-sync.ts` (de-drift onto the orchestrator)

There are currently two divergent sync mechanisms:

- `lib/inngest/functions/supplier-sync.ts` — the daily cron, with **hardcoded inline blocks**
  for MiRO/Nology/Scoop only. No Rectron.
- `lib/suppliers/sync-orchestrator.ts` — the newer **registry-based** `syncAllSuppliers()`,
  whose registry **already includes RECTRON** (and supports `dry_run`, `parallel`, and a
  `suppliers` filter). Used only by CLI scripts, never by the cron.

**Decision (Rule 7 — adopt the more recent pattern, remove the drift):** replace the cron's
three inline supplier blocks with a single `syncAllSuppliers()` call. Rectron is then included
automatically via the registry — no per-supplier cron code at all.

- Replace the `determine-suppliers` + inline MiRO/Nology/Scoop `step.run` blocks with one
  `step.run('sync-all-suppliers', () => syncAllSuppliers({ ... }))`.
- Map the existing event contract onto orchestrator options so nothing breaks:
  - `eventData.supplier_code` (`'ALL'` | `'MIRO'` | `'RECTRON'` | ...) → `suppliers` option
    (`'ALL'` ⇒ omit the filter; a specific code ⇒ pass that code).
  - `triggered_by` (`cron`→`scheduled`, else `manual`), `dry_run`, `admin_user_id` map directly.
- Adapt the completion/error events to read from the orchestrator's `AggregateSyncResult`
  (`suppliers_synced`, `totals`, per-supplier `outcomes` with `error`).

This puts Rectron on the existing daily cron, removes the duplicated inline logic, and keeps
the manual per-supplier trigger working via `supplier/sync.requested { supplier_code }`.

**Blast radius note:** this changes how MiRO/Nology/Scoop run on the cron (now via the
orchestrator instead of inline). The orchestrator already produces the same `SyncResult` per
supplier and writes the same `supplier_sync_logs`, so behaviour is equivalent — but the
verification step MUST confirm all four suppliers still sync and the completion/failure events
still fire with correct totals.

## Data flow

```
public download page  ──scrape──▶  filename (RECTRON_PRICE_LIST_YYYYMMDD_HHMM.xlsm)
        │
        └──build──▶  CDN URL  ──download/validate──▶  /home/circletel/products/pricelist/<filename>.xlsm
                                                              │
                                                  parseRectronFile (existing)
                                                              │
                                            upsert supplier_products (existing)
                                                              │
                                            supplier_sync_logs entry (existing)
```

## Error handling & idempotency

| Condition | Behaviour |
|---|---|
| Filename already on disk | Skip download (`downloaded: false`). Daily run is cheap; re-download only on a new timestamp. |
| Page fetch fails / no filename match | Downloader throws → sync falls back to latest local file, logs warning. |
| CDN 404 (filename listed but file not yet published) | Throws; Inngest step retry covers transient cases; otherwise falls back to local file. |
| Partial/corrupt download | PK-header + min-size validation before atomic rename; temp file discarded; never exposes a half-written file. |
| No local file and download failed | Existing `No files matching` error surfaces. |

Old files are **not** pruned in v1 (the file is small and accumulates slowly — YAGNI). Pruning
to keep the last N files is a possible later enhancement.

## Testing

Test-driven; tests written before implementation.

1. **Unit — filename extraction:** parse a saved HTML fixture of the real download page;
   assert `resolveLatestRectronFile` returns the correct filename and constructed CDN URL.
   Assert it throws when the page contains no matching filename.
2. **Unit — idempotency:** with a file of the resolved name already present in a temp watch
   dir, assert `downloadRectronPricelist` returns `downloaded: false` and performs no network write.
3. **Real verification — Rectron path:** `scripts/sync-rectron.ts` (sources `.env.local`) runs
   `downloadRectronPricelist()` then `syncRectronProducts({ dry_run: true })` against the live
   source; asserts it fetches the current day's file and the parser yields > 0 products. This is
   the genuine end-to-end check (not a mock of the thing under test).
4. **Regression — orchestrator cron migration:** confirm `syncAllSuppliers({ dry_run: true })`
   still runs all four suppliers (MiRO/Nology/Scoop/Rectron) and that the Inngest function's
   completion/failure events fire with correct aggregate totals. Verifies the de-drift change
   didn't alter MiRO/Nology/Scoop behaviour.

## Files touched

| File | Change |
|---|---|
| `lib/suppliers/rectron/rectron-downloader.ts` | **New** — public-page scrape + CDN download + validation |
| `lib/suppliers/rectron/rectron-sync.ts` | Add `download` option; call downloader; fallback to local |
| `lib/suppliers/rectron/index.ts` | Add `export * from './rectron-downloader'` to the existing barrel |
| `lib/inngest/functions/supplier-sync.ts` | Replace inline MiRO/Nology/Scoop blocks with a single `syncAllSuppliers()` call (Rectron auto-included via registry) |
| `scripts/sync-rectron.ts` | **New** — manual/dry-run runner for verification (downloader + sync) |
| `lib/suppliers/rectron/__tests__/rectron-downloader.test.ts` | **New** — unit tests + HTML fixture |

No DB migration (RECTRON supplier already exists). No new env vars. No new dependencies
(ExcelJS already installed; download uses native `fetch`/`fs`).

## Out of scope

- Authenticated login flow (not needed unless Rectron gates the page later).
- Auto-generating CircleTel products / solutions / bundles from the Rectron data — separate
  follow-up project with its own pricing/margin mapping rules.
- Stock levels (Rectron provides none; stock fields remain 0, as today).
