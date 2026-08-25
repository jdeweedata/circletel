/**
 * Vendor cache orchestrator: pull → stage → publish
 */

import { getVendorCacheDb } from './db';
import { startSyncRun, finishSyncRun } from './sync-runs';
import { pullRuijieToStage } from './pull/ruijie';
import { publishRuijieFromStage } from './publish/ruijie';
import { pullTaranaToStage } from './pull/tarana';
import { publishTaranaFromStage } from './publish/tarana';
import { pullInterstellioToStage } from './pull/interstellio';
import { publishInterstellioFromStage } from './publish/interstellio';
import type { SyncOptions, SyncRunResult, VendorName } from './types';

export async function syncVendor(
  vendor: VendorName,
  options: SyncOptions = {}
): Promise<SyncRunResult> {
  const dryRun = options.dryRun === true;
  const publishOnly = options.publishOnly === true;
  const started = Date.now();
  const db = getVendorCacheDb();
  const syncRunId = startSyncRun(db, vendor);
  const errors: string[] = [];
  let fetched = 0;
  let published = 0;
  let skipped = 0;
  const details: Record<string, unknown> = {};

  try {
    if (vendor === 'ruijie') {
      if (!publishOnly) {
        const pull = await pullRuijieToStage(db);
        fetched = pull.fetched;
        errors.push(...pull.errors);
        details.pull = pull;
      } else {
        fetched = (
          db.prepare('SELECT COUNT(*) AS c FROM stage_ruijie_devices').get() as {
            c: number;
          }
        ).c;
      }

      if (dryRun) {
        skipped = fetched;
        finishSyncRun(db, syncRunId, {
          status: 'dry_run',
          fetched,
          published: 0,
          errors,
        });
        return {
          vendor,
          success: errors.length === 0,
          dryRun,
          publishOnly,
          syncRunId,
          fetched,
          published: 0,
          skipped,
          errors,
          durationMs: Date.now() - started,
          details,
        };
      }

      const pub = await publishRuijieFromStage(db, {
        durationMs: Date.now() - started,
      });
      published = pub.published;
      errors.push(...pub.errors);
      details.publish = pub;
    } else if (vendor === 'tarana') {
      if (!publishOnly) {
        const pull = await pullTaranaToStage(db);
        fetched = pull.fetched;
        errors.push(...pull.errors);
        details.pull = pull;
      } else {
        fetched = (
          db
            .prepare(
              `SELECT COUNT(*) AS c FROM stage_tarana_devices WHERE device_type = 'BN'`
            )
            .get() as { c: number }
        ).c;
      }

      if (dryRun) {
        skipped = fetched;
        finishSyncRun(db, syncRunId, {
          status: 'dry_run',
          fetched,
          published: 0,
          errors,
        });
        return {
          vendor,
          success: errors.length === 0,
          dryRun,
          publishOnly,
          syncRunId,
          fetched,
          published: 0,
          skipped,
          errors,
          durationMs: Date.now() - started,
          details,
        };
      }

      const pub = await publishTaranaFromStage(db, {
        deleteStale: options.deleteStale === true,
        durationMs: Date.now() - started,
      });
      published = pub.published;
      errors.push(...pub.errors);
      details.publish = pub;
    } else if (vendor === 'interstellio') {
      if (!publishOnly) {
        const pull = await pullInterstellioToStage(db, {
          usageDays: options.usageDays ?? 2,
        });
        fetched = pull.fetched;
        errors.push(...pull.errors);
        details.pull = pull;
      } else {
        const subs = (
          db
            .prepare('SELECT COUNT(*) AS c FROM stage_interstellio_subscribers')
            .get() as { c: number }
        ).c;
        const usage = (
          db
            .prepare('SELECT COUNT(*) AS c FROM stage_interstellio_usage')
            .get() as { c: number }
        ).c;
        fetched = subs + usage;
      }

      if (dryRun) {
        skipped = fetched;
        finishSyncRun(db, syncRunId, {
          status: 'dry_run',
          fetched,
          published: 0,
          errors,
        });
        return {
          vendor,
          success: errors.length === 0,
          dryRun,
          publishOnly,
          syncRunId,
          fetched,
          published: 0,
          skipped,
          errors,
          durationMs: Date.now() - started,
          details,
        };
      }

      const pub = await publishInterstellioFromStage(db);
      published = pub.published;
      errors.push(...pub.errors);
      details.publish = pub;
    }

    const success = errors.length === 0;
    finishSyncRun(db, syncRunId, {
      status: success ? 'completed' : 'completed',
      fetched,
      published,
      errors,
    });

    return {
      vendor,
      success,
      dryRun,
      publishOnly,
      syncRunId,
      fetched,
      published,
      skipped,
      errors,
      durationMs: Date.now() - started,
      details,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    finishSyncRun(db, syncRunId, {
      status: 'failed',
      fetched,
      published,
      errors,
    });
    return {
      vendor,
      success: false,
      dryRun,
      publishOnly,
      syncRunId,
      fetched,
      published,
      skipped,
      errors,
      durationMs: Date.now() - started,
      details,
    };
  }
}

export async function syncVendors(
  vendors: VendorName[],
  options: SyncOptions = {}
): Promise<SyncRunResult[]> {
  const results: SyncRunResult[] = [];
  for (const vendor of vendors) {
    results.push(await syncVendor(vendor, options));
  }
  return results;
}
