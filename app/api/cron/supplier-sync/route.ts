/**
 * Supplier Product Sync (scheduled, HTTP cron)
 *
 * Vercel cron job that syncs distributor catalogues (Scoop, MiRO, Nology,
 * Rectron) into the supplier_products table via the registry-based
 * orchestrator. Unlike competitor-scrape, this does the work directly rather
 * than queueing Inngest — Inngest cron/event execution is not active in this
 * deployment, so the previous Inngest-cron trigger never fired.
 *
 * Schedule: Daily at 2 AM SAST (midnight UTC) — see vercel.json crons.
 *
 * Optional query param `?supplier=RECTRON` (comma-separated) restricts the run
 * to specific supplier codes; omitted = all active suppliers.
 */

import { NextResponse } from 'next/server';
import { syncAllSuppliers } from '@/lib/suppliers/sync-orchestrator';
import { cronLogger } from '@/lib/logging';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify the request is from the scheduler
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    cronLogger.error('[CronSupplierSync] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const supplier = searchParams.get('supplier') || undefined;

  cronLogger.info(
    `[CronSupplierSync] Starting supplier sync${supplier ? ` (${supplier})` : ' (all active)'}...`
  );

  try {
    const result = await syncAllSuppliers({
      triggered_by: 'scheduled',
      suppliers: supplier,
    });

    cronLogger.info('[CronSupplierSync] Complete', {
      suppliers_synced: result.suppliers_synced,
      suppliers_failed: result.suppliers_failed,
      products_found: result.totals.products_found,
      products_created: result.totals.products_created,
      products_updated: result.totals.products_updated,
    });

    return NextResponse.json({
      success: result.success,
      suppliers_synced: result.suppliers_synced,
      suppliers_failed: result.suppliers_failed,
      suppliers_skipped: result.suppliers_skipped,
      totals: result.totals,
      suppliers: result.suppliers.map((o) => ({
        code: o.supplier_code,
        success: o.success,
        error: o.error,
        skipped: o.skipped,
        products_found: o.result?.stats.products_found,
        products_created: o.result?.stats.products_created,
        products_updated: o.result?.stats.products_updated,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    cronLogger.error('[CronSupplierSync] Error', { error: message });
    return NextResponse.json(
      { error: 'Failed to sync suppliers', details: message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // suppliers download + parse + upsert thousands of rows
