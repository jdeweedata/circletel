# Rectron Catalogue Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically download Rectron's latest price-list `.xlsm` (no auth) and sync it into `supplier_products` on the existing daily supplier-sync cron.

**Architecture:** A new stateless downloader scrapes the public RectronZone download page for the current datestamped filename, downloads that file from the public storefront7 CDN, validates it, and drops it into the existing watch directory. The existing Rectron parser/sync then runs unchanged. The daily Inngest cron is migrated off its hardcoded inline supplier blocks onto the existing registry-based `syncAllSuppliers()` orchestrator, which already registers Rectron.

**Tech Stack:** TypeScript, Next.js 15, Node `fetch`/`fs`, ExcelJS (existing), Inngest, Jest + ts-jest, Supabase.

## Global Constraints

- No new npm dependencies (use native `fetch` and `fs`; ExcelJS already installed).
- No DB migration (the `RECTRON` supplier row already exists).
- No credentials/secrets — the page and CDN are both public. Do NOT add Rectron username/password anywhere.
- Tests use Jest with `import { ... } from '@jest/globals'` (matches existing repo convention).
- Run scripts that need DB creds with: `set -a && source .env.local && set +a && npx tsx scripts/<name>.ts`.
- Type-check before any commit: `npm run type-check:memory`.
- Filename format is exactly `RECTRON_PRICE_LIST_YYYYMMDD_HHMM.xlsm`; CDN base is `https://content.storefront7.co.za/stores/za.co.storefront7.rectron/pricelists/`; download page is `https://www.rectronzone.co.za/rectron/downloadzone`.
- Prerequisite (verify in Task 4, fix as data if needed): the `suppliers` row with `code='RECTRON'` must have `is_active=true`, or the orchestrator will skip it.

## File Structure

| File | Responsibility |
|---|---|
| `lib/suppliers/rectron/rectron-downloader.ts` | **New.** Resolve latest filename from public page; download+validate from CDN into watch dir; idempotent skip. |
| `lib/suppliers/rectron/__tests__/rectron-downloader.test.ts` | **New.** Unit tests for resolve + download (success, idempotency, no-match). |
| `lib/suppliers/rectron/rectron-types.ts` | Add optional `download_page_url`/`cdn_base_url` to `RectronSyncConfig`. |
| `lib/suppliers/rectron/rectron-sync.ts` | Add `download` option; call downloader before local-file fallback; record non-fatal download warning in sync log. |
| `lib/suppliers/rectron/index.ts` | Export the downloader from the barrel. |
| `lib/inngest/functions/supplier-sync.ts` | Replace inline MiRO/Nology/Scoop blocks with one `syncAllSuppliers()` call; preserve emitted event shape. |
| `scripts/sync-rectron.ts` | **New.** Manual/dry-run runner for end-to-end verification. |

---

## Task 1: Rectron downloader (new component)

**Files:**
- Create: `lib/suppliers/rectron/rectron-downloader.ts`
- Test: `lib/suppliers/rectron/__tests__/rectron-downloader.test.ts`
- Modify: `lib/suppliers/rectron/index.ts`

**Interfaces:**
- Produces:
  - `resolveLatestRectronFile(config?: { pageUrl?: string; cdnBase?: string }): Promise<{ filename: string; url: string }>`
  - `downloadRectronPricelist(config: { watchDir: string; pageUrl?: string; cdnBase?: string }): Promise<{ filePath: string; filename: string; downloaded: boolean }>`
  - Constants `RECTRON_DOWNLOAD_PAGE_URL`, `RECTRON_CDN_BASE`, `RECTRON_FILENAME_RE`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing test**

Create `lib/suppliers/rectron/__tests__/rectron-downloader.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  resolveLatestRectronFile,
  downloadRectronPricelist,
  RECTRON_CDN_BASE,
} from '../rectron-downloader'

const PAGE_URL = 'https://www.rectronzone.co.za/rectron/downloadzone'
const FILENAME = 'RECTRON_PRICE_LIST_20260626_0733.xlsm'
const FIXTURE_HTML = `<html><body><table>
  <tr><td>Price List</td><td>${FILENAME}</td><td>2026-06-26</td></tr>
</table></body></html>`

// Minimal valid xlsx: PK zip header + padding above the 10KB sanity floor
const ZIP_BYTES = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.alloc(10_001),
])

function mockFetchRouting() {
  return jest.fn(async (input: any) => {
    const url = String(input)
    if (url === PAGE_URL) {
      return { ok: true, status: 200, text: async () => FIXTURE_HTML } as any
    }
    if (url.startsWith(RECTRON_CDN_BASE)) {
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => ZIP_BYTES.buffer.slice(
          ZIP_BYTES.byteOffset,
          ZIP_BYTES.byteOffset + ZIP_BYTES.byteLength
        ),
      } as any
    }
    throw new Error(`Unexpected fetch URL: ${url}`)
  })
}

describe('rectron-downloader', () => {
  let dir: string
  const realFetch = global.fetch

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rectron-dl-'))
  })
  afterEach(() => {
    global.fetch = realFetch
    rmSync(dir, { recursive: true, force: true })
  })

  it('resolves the latest filename and CDN url from the public page', async () => {
    global.fetch = mockFetchRouting() as any
    const { filename, url } = await resolveLatestRectronFile()
    expect(filename).toBe(FILENAME)
    expect(url).toBe(RECTRON_CDN_BASE + FILENAME)
  })

  it('throws when the page has no matching filename', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true, status: 200, text: async () => '<html>no file here</html>',
    })) as any
    await expect(resolveLatestRectronFile()).rejects.toThrow(/no .*filename/i)
  })

  it('downloads and validates the file when not already present', async () => {
    global.fetch = mockFetchRouting() as any
    const res = await downloadRectronPricelist({ watchDir: dir })
    expect(res.downloaded).toBe(true)
    expect(res.filename).toBe(FILENAME)
    expect(existsSync(res.filePath)).toBe(true)
    const head = readFileSync(res.filePath).subarray(0, 4)
    expect(Array.from(head)).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it('skips download when the file already exists (idempotent)', async () => {
    writeFileSync(join(dir, FILENAME), ZIP_BYTES)
    const fetchMock = mockFetchRouting()
    global.fetch = fetchMock as any
    const res = await downloadRectronPricelist({ watchDir: dir })
    expect(res.downloaded).toBe(false)
    expect(res.filePath).toBe(join(dir, FILENAME))
    // Only the page was fetched (to learn the filename); the CDN was NOT hit
    const cdnCalls = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith(RECTRON_CDN_BASE)
    )
    expect(cdnCalls.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest lib/suppliers/rectron/__tests__/rectron-downloader.test.ts`
Expected: FAIL — `Cannot find module '../rectron-downloader'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/suppliers/rectron/rectron-downloader.ts`:

```typescript
/**
 * Rectron Price-List Downloader
 *
 * The RectronZone download page is public (no login) and lists the current
 * datestamped price-list filename. The file itself is served publicly by the
 * storefront7 CDN. This module resolves the current filename from the page and
 * downloads it into the watch directory for the existing Rectron sync to parse.
 *
 * No authentication or credentials are required.
 */

import { existsSync, mkdirSync } from 'fs'
import { writeFile, rename, unlink } from 'fs/promises'
import { join } from 'path'

export const RECTRON_DOWNLOAD_PAGE_URL =
  'https://www.rectronzone.co.za/rectron/downloadzone'
export const RECTRON_CDN_BASE =
  'https://content.storefront7.co.za/stores/za.co.storefront7.rectron/pricelists/'
export const RECTRON_FILENAME_RE = /RECTRON_PRICE_LIST_\d{8}_\d{4}\.xlsm/
/** Sanity floor — the real file is hundreds of KB; anything tiny is an error page. */
const MIN_BYTES = 10_000
/** xlsx is a zip; first four bytes must be the local-file-header magic "PK\x03\x04". */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

export interface RectronDownloadResult {
  filePath: string
  filename: string
  downloaded: boolean
}

/**
 * Fetch the public download page and extract the current price-list filename,
 * returning it together with its full CDN URL.
 */
export async function resolveLatestRectronFile(
  config: { pageUrl?: string; cdnBase?: string } = {}
): Promise<{ filename: string; url: string }> {
  const pageUrl = config.pageUrl || RECTRON_DOWNLOAD_PAGE_URL
  const cdnBase = config.cdnBase || RECTRON_CDN_BASE

  const res = await fetch(pageUrl)
  if (!res.ok) {
    throw new Error(
      `Rectron download page returned HTTP ${res.status} (${pageUrl})`
    )
  }
  const html = await res.text()
  const match = html.match(RECTRON_FILENAME_RE)
  if (!match) {
    throw new Error(
      `Could not find a RECTRON_PRICE_LIST filename on the download page`
    )
  }
  const filename = match[0]
  return { filename, url: cdnBase + filename }
}

/**
 * Ensure the latest Rectron price-list file is present in `watchDir`.
 * Skips the download if a file of that name already exists.
 */
export async function downloadRectronPricelist(config: {
  watchDir: string
  pageUrl?: string
  cdnBase?: string
}): Promise<RectronDownloadResult> {
  const { filename, url } = await resolveLatestRectronFile(config)

  mkdirSync(config.watchDir, { recursive: true })
  const filePath = join(config.watchDir, filename)

  if (existsSync(filePath)) {
    return { filePath, filename, downloaded: false }
  }

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Rectron CDN returned HTTP ${res.status} for ${filename}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())

  if (buf.length < MIN_BYTES) {
    throw new Error(
      `Downloaded Rectron file is too small (${buf.length} bytes) — likely not the real price list`
    )
  }
  const magicOk = ZIP_MAGIC.every((b, i) => buf[i] === b)
  if (!magicOk) {
    throw new Error(
      `Downloaded Rectron file is not a valid xlsx/zip (bad magic bytes)`
    )
  }

  // Write to a temp file then atomically rename, so the parser never sees a partial file.
  const tmpPath = `${filePath}.tmp`
  try {
    await writeFile(tmpPath, buf)
    await rename(tmpPath, filePath)
  } catch (err) {
    await unlink(tmpPath).catch(() => {})
    throw err
  }

  return { filePath, filename, downloaded: true }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest lib/suppliers/rectron/__tests__/rectron-downloader.test.ts`
Expected: PASS — 4 passing tests.

- [ ] **Step 5: Export from the barrel**

Edit `lib/suppliers/rectron/index.ts` — add after the existing `export *` lines:

```typescript
export * from './rectron-downloader'
```

- [ ] **Step 6: Type-check and commit**

Run: `npm run type-check:memory`
Expected: no NEW errors in `rectron-downloader.ts` or its test (the repo has pre-existing errors elsewhere; only your files must be clean).

```bash
git add lib/suppliers/rectron/rectron-downloader.ts \
        lib/suppliers/rectron/__tests__/rectron-downloader.test.ts \
        lib/suppliers/rectron/index.ts
git commit -m "feat(suppliers): Rectron price-list downloader (public page + CDN, no auth)"
```

---

## Task 2: Wire auto-download into the Rectron sync

**Files:**
- Modify: `lib/suppliers/rectron/rectron-types.ts` (extend `RectronSyncConfig`)
- Modify: `lib/suppliers/rectron/rectron-sync.ts:37-72` (options + file resolution) and the two sync-log finalization sites
- Test: reuse `lib/suppliers/rectron/__tests__/rectron-downloader.test.ts` (no new test file; sync behaviour is verified end-to-end in Task 4)

**Interfaces:**
- Consumes: `downloadRectronPricelist` from Task 1.
- Produces: `syncRectronProducts(options: { ...; download?: boolean })` — `download` defaults to `true`. When the registry (Task 3 / orchestrator) calls it without `download`, auto-download is therefore ON.

- [ ] **Step 1: Extend the config type**

Edit `lib/suppliers/rectron/rectron-types.ts` — add two optional fields to `RectronSyncConfig`:

```typescript
export interface RectronSyncConfig {
  /** Directory to watch for new xlsm files */
  watch_dir: string
  /** File pattern to match (e.g., "RECTRON_PRICE_LIST_*.xlsm") */
  file_pattern: string
  /** Whether to archive processed files */
  archive_processed: boolean
  /** Optional override for the public download page URL */
  download_page_url?: string
  /** Optional override for the CDN base URL */
  cdn_base_url?: string
}
```

- [ ] **Step 2: Import the downloader in the sync**

Edit `lib/suppliers/rectron/rectron-sync.ts` — add to the imports near the top (after the `parseRectronFile` import):

```typescript
import { downloadRectronPricelist } from './rectron-downloader'
```

- [ ] **Step 3: Add the `download` option to the function signature**

Edit `lib/suppliers/rectron/rectron-sync.ts` — in the `syncRectronProducts` options object (currently ends with `file_path?: string`), add:

```typescript
  /** Auto-download the latest file before syncing (default: true) */
  download?: boolean
```

- [ ] **Step 4: Replace the file-resolution block**

Edit `lib/suppliers/rectron/rectron-sync.ts`. Replace this existing block:

```typescript
  // Find the latest file
  const filePath = options.file_path || findLatestFile(watchDir, filePattern)

  if (!filePath) {
    throw new Error(
      `No files matching "${filePattern}" found in ${watchDir}`
    )
  }

  console.log(`[RectronSync] Using file: ${filePath}`)
```

with:

```typescript
  // Resolve the file to parse:
  // 1. explicit override, else 2. auto-download latest, else 3. latest local file.
  let filePath = options.file_path
  let downloadWarning: string | null = null

  if (!filePath && (options.download ?? true)) {
    try {
      const dl = await downloadRectronPricelist({
        watchDir,
        pageUrl: config.download_page_url,
        cdnBase: config.cdn_base_url,
      })
      filePath = dl.filePath
      console.log(
        `[RectronSync] Auto-download: ${dl.filename} (downloaded=${dl.downloaded})`
      )
    } catch (error) {
      downloadWarning = `Auto-download failed, using latest local file: ${
        error instanceof Error ? error.message : String(error)
      }`
      console.warn(`[RectronSync] ${downloadWarning}`)
    }
  }

  if (!filePath) {
    filePath = findLatestFile(watchDir, filePattern)
  }

  if (!filePath) {
    throw new Error(
      `No files matching "${filePattern}" found in ${watchDir}`
    )
  }

  console.log(`[RectronSync] Using file: ${filePath}`)
```

- [ ] **Step 5: Record the download warning in the dry-run sync log**

Edit `lib/suppliers/rectron/rectron-sync.ts` — in the dry-run `error_details` object, add the `download_warning` field:

```typescript
          error_details: {
            dry_run: true,
            file: basename(filePath),
            products_parsed: parseResult.products_parsed,
            download_warning: downloadWarning,
          },
```

- [ ] **Step 6: Record the download warning in the completion sync log**

Edit `lib/suppliers/rectron/rectron-sync.ts` — replace the completion `error_message` ternary:

```typescript
        error_message: hasErrors
          ? [
              ...parseResult.errors,
              ...upsertResult.errors.map((e) => `${e.sku}: ${e.error}`),
            ]
              .slice(0, 5)
              .join('; ')
          : null,
```

with a version that folds in the non-fatal download warning:

```typescript
        error_message: (() => {
          const messages = [
            ...(downloadWarning ? [downloadWarning] : []),
            ...parseResult.errors,
            ...upsertResult.errors.map((e) => `${e.sku}: ${e.error}`),
          ]
          return messages.length ? messages.slice(0, 5).join('; ') : null
        })(),
```

- [ ] **Step 7: Type-check and commit**

Run: `npm run type-check:memory`
Expected: no NEW errors in `rectron-sync.ts` / `rectron-types.ts`.

```bash
git add lib/suppliers/rectron/rectron-sync.ts lib/suppliers/rectron/rectron-types.ts
git commit -m "feat(suppliers): auto-download latest Rectron file before sync (fallback to local)"
```

---

## Task 3: De-drift the cron onto the orchestrator

**Files:**
- Modify: `lib/inngest/functions/supplier-sync.ts:14-19` (imports) and `:49-289` (handler body)

**Interfaces:**
- Consumes: `syncAllSuppliers(options: { triggered_by?; triggered_by_user_id?; dry_run?; suppliers?; parallel?; verbose? }): Promise<AggregateSyncResult>` from `@/lib/suppliers/sync-orchestrator`. `AggregateSyncResult` has `.totals { products_found, products_created, products_updated, products_unchanged, products_deactivated, images_cached, duration_ms }` and `.suppliers: SupplierSyncOutcome[]` where each outcome is `{ supplier_code, supplier_name, success, result?, error?, skipped? }`.
- Produces: unchanged Inngest event contract — still emits `supplier/sync.completed[_with_errors]` with `{ suppliers_synced: string[], results, totals: { totalProducts, totalCreated, totalUpdated, totalUnchanged, totalDeactivated, suppliers_synced, suppliers_failed }, errors?, duration_ms, dry_run }`, so `supplierSyncCompletedFunction` stays untouched.

- [ ] **Step 1: Swap the imports**

Edit `lib/inngest/functions/supplier-sync.ts` — replace these four lines:

```typescript
import { syncMiRoProducts } from '@/lib/suppliers/miro'
import { syncNologyProducts } from '@/lib/suppliers/nology'
import { syncScoopProducts } from '@/lib/suppliers/scoop-sync'
import type { SyncResult } from '@/lib/suppliers/types'
```

with:

```typescript
import { syncAllSuppliers } from '@/lib/suppliers/sync-orchestrator'
```

(`SyncResult` is no longer referenced after Step 2 removes the inline blocks.)

- [ ] **Step 2: Replace the handler body**

Edit `lib/inngest/functions/supplier-sync.ts` — replace the entire handler arrow body (everything from `async ({ event, step }) => {` on line ~49 through its closing `}` on line ~288, i.e. the body of the FIRST `inngest.createFunction` call only — do NOT touch `supplierSyncCompletedFunction`/`supplierSyncFailedFunction`) with:

```typescript
  async ({ event, step }) => {
    // Extract options from event data
    const eventData = event?.data as {
      sync_log_id?: string
      supplier_code?: string // 'MIRO' | 'NOLOGY' | 'SCOOP' | 'RECTRON' | 'ALL'
      triggered_by?: 'cron' | 'manual'
      admin_user_id?: string
      options?: { dryRun?: boolean }
    } | undefined

    const supplierCode = eventData?.supplier_code || 'ALL'
    const triggeredBy = eventData?.triggered_by ?? 'cron'
    const adminUserId = eventData?.admin_user_id
    const dryRun = eventData?.options?.dryRun ?? false

    const startTime = Date.now()

    // Step 1: Run all (or one) suppliers via the registry-based orchestrator.
    // The orchestrator's registry includes MiRO/Nology/Scoop/Rectron and filters
    // by the suppliers' is_active flag. Rectron auto-downloads its file internally.
    const agg = await step.run('sync-all-suppliers', async () => {
      return await syncAllSuppliers({
        triggered_by: triggeredBy === 'cron' ? 'scheduled' : 'manual',
        triggered_by_user_id: adminUserId,
        dry_run: dryRun,
        suppliers: supplierCode === 'ALL' ? undefined : supplierCode,
      })
    })

    // Codes that actually ran (exclude inactive/skipped entries)
    const suppliersToSync = agg.suppliers
      .filter((o) => !o.skipped)
      .map((o) => o.supplier_code)

    const errors = agg.suppliers
      .filter((o) => !o.success && o.error)
      .map((o) => `${o.supplier_code}: ${o.error}`)

    // Map the orchestrator totals onto the legacy event shape the
    // completion handler already expects.
    const totals = {
      totalProducts: agg.totals.products_found,
      totalCreated: agg.totals.products_created,
      totalUpdated: agg.totals.products_updated,
      totalUnchanged: agg.totals.products_unchanged,
      totalDeactivated: agg.totals.products_deactivated,
      suppliers_synced: agg.suppliers_synced,
      suppliers_failed: agg.suppliers_failed,
    }

    console.log(
      `[SupplierSync] Syncing suppliers: ${suppliersToSync.join(', ') || '(none)'}`
    )

    // Step 2: Emit completion event (shape unchanged from before).
    await step.run('send-completion-event', async () => {
      const hasErrors = errors.length > 0
      const eventName = hasErrors
        ? 'supplier/sync.completed_with_errors'
        : 'supplier/sync.completed'

      await inngest.send({
        name: eventName,
        data: {
          suppliers_synced: suppliersToSync,
          results: Object.fromEntries(
            agg.suppliers
              .filter((o) => o.result)
              .map((o) => [
                o.supplier_code,
                {
                  success: o.success,
                  log_id: o.result!.log_id,
                  products_found: o.result!.stats.products_found,
                  products_created: o.result!.stats.products_created,
                  products_updated: o.result!.stats.products_updated,
                  error: o.error,
                },
              ])
          ),
          totals,
          errors: hasErrors ? errors : undefined,
          duration_ms: Date.now() - startTime,
          dry_run: dryRun,
        },
      })
    })

    const totalDuration = Date.now() - startTime
    const hasErrors = errors.length > 0

    console.log(
      `[SupplierSync] Complete: ${totals.totalProducts} products found, ` +
        `${totals.totalCreated} created, ${totals.totalUpdated} updated ` +
        `(${totalDuration}ms, ${errors.length} errors)`
    )

    return {
      success: !hasErrors,
      suppliers_synced: suppliersToSync,
      totals,
      errors: hasErrors ? errors : undefined,
      duration_ms: totalDuration,
      dry_run: dryRun,
    }
  }
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory`
Expected: no NEW errors in `supplier-sync.ts`. (If `SyncResult` is reported as unused, confirm Step 1 removed its import.)

- [ ] **Step 4: Commit**

```bash
git add lib/inngest/functions/supplier-sync.ts
git commit -m "refactor(inngest): run daily supplier-sync via registry orchestrator (adds Rectron)"
```

---

## Task 4: Manual runner + real end-to-end verification

**Files:**
- Create: `scripts/sync-rectron.ts`

**Interfaces:**
- Consumes: `downloadRectronPricelist` (Task 1), `syncRectronProducts` (Task 2), `syncAllSuppliers` (Task 3).

- [ ] **Step 1: Write the runner script**

Create `scripts/sync-rectron.ts`:

```typescript
/**
 * Manual Rectron sync runner — for verification.
 *
 * Usage (loads .env.local for Supabase service-role creds):
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts          # dry run
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --write  # real upsert
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --all    # all suppliers (dry)
 */
import { downloadRectronPricelist } from '../lib/suppliers/rectron/rectron-downloader'

async function main() {
  const write = process.argv.includes('--write')
  const all = process.argv.includes('--all')

  if (all) {
    const { syncAllSuppliers } = await import('../lib/suppliers/sync-orchestrator')
    const res = await syncAllSuppliers({ dry_run: !write, verbose: true })
    console.log(JSON.stringify(res, null, 2))
    return
  }

  // Rectron only: prove the download works, then run the sync.
  const dl = await downloadRectronPricelist({
    watchDir: '/home/circletel/products/pricelist',
  })
  console.log(
    `Download: ${dl.filename} (downloaded=${dl.downloaded}) -> ${dl.filePath}`
  )

  const { syncRectronProducts } = await import('../lib/suppliers/rectron')
  const res = await syncRectronProducts({
    triggered_by: 'manual',
    dry_run: !write,
    download: false, // already downloaded above
  })
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Confirm RECTRON supplier is active (prerequisite)**

Run:

```bash
cd /home/circletel && set -a && source .env.local && set +a && \
npx tsx -e "import {createClient} from '@supabase/supabase-js'; const s=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!); s.from('suppliers').select('code,is_active,feed_type,metadata').eq('code','RECTRON').single().then(r=>{console.log(r.data,r.error)})"
```

Expected: a row with `is_active: true`. If `is_active` is `false`, activate it (data fix, not a migration):

```bash
cd /home/circletel && set -a && source .env.local && set +a && \
npx tsx -e "import {createClient} from '@supabase/supabase-js'; const s=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!); s.from('suppliers').update({is_active:true}).eq('code','RECTRON').then(r=>console.log('activated',r.error))"
```

- [ ] **Step 3: Run the Rectron dry-run end-to-end (REAL verification)**

Run:

```bash
cd /home/circletel && set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts
```

Expected output includes:
- `Download: RECTRON_PRICE_LIST_<today-ish>.xlsm (downloaded=true) -> /home/circletel/products/pricelist/...`
- A JSON `SyncResult` with `success: true` and `stats.products_found` **> 0** (the parser found products).

Record the actual `products_found` number in the commit message / PR. This is the genuine end-to-end proof (live page → live CDN → real parser), not a mock.

- [ ] **Step 4: Run the orchestrator dry-run regression (all four suppliers)**

Run:

```bash
cd /home/circletel && set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --all
```

Expected: an `AggregateSyncResult` whose `.suppliers` array contains outcomes for the active suppliers including `RECTRON`, with `RECTRON.success: true`. Confirms the de-drift change (Task 3) still runs MiRO/Nology/Scoop and now Rectron. (Suppliers without a reachable feed may report their own errors — that is independent of this change; what matters is RECTRON now appears and succeeds.)

- [ ] **Step 5: Run the full unit test suite for the module**

Run: `npx jest lib/suppliers/rectron/`
Expected: PASS (4 downloader tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-rectron.ts
git commit -m "chore(scripts): manual Rectron sync runner for verification"
```

---

## Self-Review

**1. Spec coverage:**
- Downloader (public scrape + CDN + validate + atomic + idempotent skip) → Task 1. ✓
- `download` option + local-file fallback + warning in sync log → Task 2. ✓
- Barrel export → Task 1 Step 5. ✓
- De-drift cron onto `syncAllSuppliers`, preserve event contract → Task 3. ✓
- No migration / no env vars / no deps → Global Constraints; honored (native fetch/fs, RECTRON row exists). ✓
- Tests: filename extraction (Task 1 test 1), idempotency (Task 1 test 4), real e2e Rectron (Task 4 Step 3), orchestrator regression (Task 4 Step 4). ✓ — matches spec testing items 1–4.
- RECTRON `is_active` prerequisite (orchestrator filters on it) → Task 4 Step 2. ✓ (gap caught during planning: the old cron filtered by `feed_type in (html,xml,xlsx,csv)` which excluded Rectron's `xlsm`; the orchestrator filters by registry+is_active instead, so this is the relevant gate now.)

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". All code shown in full.

**3. Type consistency:** `downloadRectronPricelist({ watchDir, pageUrl?, cdnBase? })` and `{ filePath, filename, downloaded }` used identically in Task 1 (def + tests), Task 2 (sync call), Task 4 (script). `syncRectronProducts({ ..., download })` defined in Task 2, called with `download: false` in Task 4. `syncAllSuppliers` option/return field names (`suppliers`, `triggered_by`, `totals.products_*`, `suppliers[].result.stats.*`, `suppliers[].skipped`) match `sync-orchestrator.ts` as read. Legacy event `totals.total*` shape matches `supplierSyncCompletedFunction`'s reader.
