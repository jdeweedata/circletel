/**
 * Vendor SQLite staging → Supabase sync CLI
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/vendor-cache/sync.ts --vendor=ruijie
 *   npx tsx scripts/vendor-cache/sync.ts --vendor=all --dry-run
 *   npx tsx scripts/vendor-cache/sync.ts --vendor=tarana --publish-only
 *   npx tsx scripts/vendor-cache/sync.ts --vendor=interstellio --usage-days=3
 *
 * Flags:
 *   --vendor=ruijie|tarana|interstellio|all
 *   --dry-run          Stage only (or count staged if --publish-only); no Supabase writes
 *   --publish-only     Skip vendor pull; publish existing staged rows
 *   --delete-stale     Tarana: delete BNs missing from API
 *   --usage-days=N     Interstellio: trailing days of daily usage (default 2)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { SyncOptions, VendorName } from '../../lib/vendor-cache/types';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function parseArgs(argv: string[]): {
  vendors: VendorName[];
  options: SyncOptions;
} {
  let vendorArg = 'all';
  const options: SyncOptions = {};

  for (const arg of argv) {
    if (arg.startsWith('--vendor=')) {
      vendorArg = arg.slice('--vendor='.length);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--publish-only') {
      options.publishOnly = true;
    } else if (arg === '--delete-stale') {
      options.deleteStale = true;
    } else if (arg.startsWith('--usage-days=')) {
      options.usageDays = Number(arg.slice('--usage-days='.length));
    }
  }

  const all: VendorName[] = ['ruijie', 'tarana', 'interstellio'];
  if (vendorArg === 'all') {
    return { vendors: all, options };
  }
  if (!all.includes(vendorArg as VendorName)) {
    console.error(
      `Invalid --vendor=${vendorArg}. Use ruijie|tarana|interstellio|all`
    );
    process.exit(1);
  }
  return { vendors: [vendorArg as VendorName], options };
}

async function main() {
  loadEnvLocal();

  const { vendors, options } = parseArgs(process.argv.slice(2));
  const { syncVendors, getVendorCacheDbPath, closeVendorCacheDb } = await import(
    '../../lib/vendor-cache'
  );

  console.log(`[vendor-cache] db=${getVendorCacheDbPath()}`);
  console.log(
    `[vendor-cache] vendors=${vendors.join(',')} dryRun=${!!options.dryRun} publishOnly=${!!options.publishOnly}`
  );

  const results = await syncVendors(vendors, options);

  for (const r of results) {
    console.log(
      `[vendor-cache] ${r.vendor}: success=${r.success} fetched=${r.fetched} published=${r.published} ` +
        `errors=${r.errors.length} durationMs=${r.durationMs} runId=${r.syncRunId}`
    );
    if (r.errors.length > 0) {
      for (const e of r.errors.slice(0, 10)) {
        console.warn(`  - ${e}`);
      }
    }
  }

  closeVendorCacheDb();

  const failed = results.some((r) => !r.success);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('[vendor-cache] fatal:', err);
  process.exit(1);
});
