/**
 * Zoho Daily Sync Service
 *
 * Orchestrates automated daily syncing of service_packages to Zoho CRM and Billing.
 * Implements smart sync logic to only process changed/failed/stale products.
 *
 * Epic 4.4 - Automated Daily Reconciliation
 */

import { createClient } from '@/lib/supabase/server';
import { syncServicePackageToZohoCRM } from './product-sync-service';
import { syncServicePackageToZohoBilling, type BillingSyncResult } from './billing-sync-service';
import rateLimiter from './rate-limiter';
import { zohoLogger } from '@/lib/logging';

// Configuration
const BATCH_SIZE = 20; // Products per batch
const BATCH_DELAY_MS = 15000; // 15 seconds between batches
const PRODUCT_DELAY_MS = 700; // 700ms between products (for 90/min compliance)
const MAX_PRODUCTS_PER_RUN = 100; // Safety limit

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sync candidate - product needing sync
 */
interface SyncCandidate {
  id: string;
  sku: string;
  name: string;
  status: string;
  last_synced_at: string | null;
  sync_status: string | null;
  zoho_crm_product_id: string | null;
  zoho_billing_plan_id: string | null;
  zoho_billing_item_id: string | null;
}

/**
 * Sync result for reporting
 */
interface SyncResult {
  productId: string;
  sku: string;
  name: string;
  crmSuccess: boolean;
  billingSuccess: boolean;
  crmError?: string;
  billingError?: string;
}

/**
 * Daily sync summary
 */
export interface DailySyncSummary {
  totalCandidates: number;
  processed: number;
  crmSucceeded: number;
  crmFailed: number;
  billingSucceeded: number;
  billingFailed: number;
  skipped: number;
  duration: number;
  results: SyncResult[];
}

/**
 * Get products needing sync (smart sync logic)
 *
 * Priority order:
 * 1. Failed syncs (sync_status = 'failed')
 * 2. Never synced (no product_integrations record)
 * 3. Stale syncs (last_synced_at > 24 hours ago)
 */
export async function getSyncCandidates(limit: number = MAX_PRODUCTS_PER_RUN): Promise<SyncCandidate[]> {
  const supabase = await createClient();

  // Query for products needing sync
  const { data, error } = await supabase.rpc('get_sync_candidates', {
    max_limit: limit
  });

  if (error) {
    // Fallback to manual query if RPC doesn't exist
    zohoLogger.warn('[DailySync] RPC function not found, using fallback query');
    return await getSyncCandidatesFallback(limit);
  }

  return data || [];
}

/**
 * Fallback query if RPC function not available
 */
async function getSyncCandidatesFallback(limit: number): Promise<SyncCandidate[]> {
  const supabase = await createClient();

  const { data: packages, error } = await supabase
    .from('service_packages')
    .select(`
      id,
      sku,
      name,
      status,
      product_integrations (
        last_synced_at,
        sync_status,
        zoho_crm_product_id,
        zoho_billing_plan_id,
        zoho_billing_item_id
      )
    `)
    .eq('status', 'active')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to query sync candidates: ${error.message}`);
  }

  // Transform and filter
  const candidates: SyncCandidate[] = [];

  for (const pkg of packages || []) {
    const integration = (pkg as any).product_integrations?.[0];

    // Include if:
    // 1. Never synced (no integration record)
    // 2. Failed sync (sync_status = 'failed')
    // 3. Stale sync (last_synced_at > 24 hours ago)
    const shouldSync =
      !integration ||
      integration.sync_status === 'failed' ||
      (integration.last_synced_at &&
        new Date().getTime() - new Date(integration.last_synced_at).getTime() > 24 * 60 * 60 * 1000);

    if (shouldSync) {
      candidates.push({
        id: pkg.id,
        sku: pkg.sku,
        name: pkg.name,
        status: pkg.status,
        last_synced_at: integration?.last_synced_at || null,
        sync_status: integration?.sync_status || null,
        zoho_crm_product_id: integration?.zoho_crm_product_id || null,
        zoho_billing_plan_id: integration?.zoho_billing_plan_id || null,
        zoho_billing_item_id: integration?.zoho_billing_item_id || null,
      });
    }
  }

  // Sort by priority (failed first, then never synced, then stale)
  candidates.sort((a, b) => {
    if (a.sync_status === 'failed' && b.sync_status !== 'failed') return -1;
    if (a.sync_status !== 'failed' && b.sync_status === 'failed') return 1;
    if (!a.last_synced_at && b.last_synced_at) return -1;
    if (a.last_synced_at && !b.last_synced_at) return 1;
    return 0;
  });

  return candidates;
}

/**
 * Update product_integrations with Billing sync result
 * Epic 4.4 Phase 3 - Uses new Billing-specific columns
 */
async function updateBillingSyncStatus(
  servicePackageId: string,
  billingResult: BillingSyncResult
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const updateData = billingResult.success
    ? {
        zoho_billing_plan_id: billingResult.planId,
        zoho_billing_item_id: billingResult.installationItemId,
        zoho_billing_hardware_item_id: billingResult.hardwareItemId || null,

        // New Billing-specific columns (Epic 4.4 Phase 3)
        zoho_billing_sync_status: 'ok' as const,
        zoho_billing_last_synced_at: now,
        zoho_billing_last_sync_error: null,

        // Legacy columns (backward compatibility - update for overall status)
        sync_status: 'ok' as const,
        last_synced_at: now,
        last_sync_error: null,
      }
    : {
        // New Billing-specific columns (Epic 4.4 Phase 3)
        zoho_billing_sync_status: 'failed' as const,
        zoho_billing_last_sync_error: billingResult.error || 'Unknown error',

        // Legacy columns (backward compatibility)
        sync_status: 'failed' as const,
        last_sync_error: billingResult.error || 'Unknown error',
      };

  const { error } = await supabase
    .from('product_integrations')
    .update(updateData)
    .eq('service_package_id', servicePackageId);

  if (error) {
    zohoLogger.error('[DailySync] Failed to update Billing sync status:', error.message);
  }
}

/**
 * Sync a single product to both CRM and Billing
 */
async function syncProduct(candidate: SyncCandidate): Promise<SyncResult> {
  const result: SyncResult = {
    productId: candidate.id,
    sku: candidate.sku,
    name: candidate.name,
    crmSuccess: false,
    billingSuccess: false,
  };

  // 1. Sync to CRM
  try {
    zohoLogger.info(`[DailySync] Syncing ${candidate.sku} to CRM...`);
    const crmResult = await syncServicePackageToZohoCRM({
      id: candidate.id,
      sku: candidate.sku,
      name: candidate.name,
      status: candidate.status,
    } as any);

    result.crmSuccess = crmResult.success;
    if (!crmResult.success) {
      result.crmError = crmResult.error;
    }
  } catch (error) {
    result.crmError = error instanceof Error ? error.message : 'Unknown error';
    zohoLogger.error(`[DailySync] CRM sync failed for ${candidate.sku}:`, error);
  }

  // Small delay between CRM and Billing
  await sleep(500);

  // 2. Sync to Billing
  try {
    zohoLogger.info(`[DailySync] Syncing ${candidate.sku} to Billing...`);
    const billingResult = await syncServicePackageToZohoBilling({
      id: candidate.id,
      sku: candidate.sku,
      name: candidate.name,
      status: candidate.status,
    } as any);

    result.billingSuccess = billingResult.success;
    if (!billingResult.success) {
      result.billingError = billingResult.error;
    }

    // Update product_integrations with Billing sync result
    await updateBillingSyncStatus(candidate.id, billingResult);

  } catch (error) {
    result.billingError = error instanceof Error ? error.message : 'Unknown error';
    zohoLogger.error(`[DailySync] Billing sync failed for ${candidate.sku}:`, error);

    // Update product_integrations with failure
    await updateBillingSyncStatus(candidate.id, {
      success: false,
      error: result.billingError,
    });
  }

  return result;
}

/**
 * Run daily sync with batch processing
 */
export async function runDailySync(options: {
  maxProducts?: number;
  dryRun?: boolean;
} = {}): Promise<DailySyncSummary> {
  const startTime = Date.now();
  const maxProducts = options.maxProducts || MAX_PRODUCTS_PER_RUN;

  zohoLogger.info('[DailySync] ═══════════════════════════════════════════════════════════');
  zohoLogger.info('[DailySync]   Zoho Daily Sync Starting');
  zohoLogger.info('[DailySync] ═══════════════════════════════════════════════════════════');
  zohoLogger.info(`[DailySync]   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  zohoLogger.info(`[DailySync]   Max Products: ${maxProducts}`);
  zohoLogger.info(`[DailySync]   Batch Size: ${BATCH_SIZE}`);
  zohoLogger.info('[DailySync] ═══════════════════════════════════════════════════════════\n');

  // 1. Get sync candidates
  zohoLogger.info('[DailySync] Step 1: Getting sync candidates...');
  const candidates = await getSyncCandidates(maxProducts);

  zohoLogger.info(`[DailySync] Found ${candidates.length} products needing sync:\n`);
  zohoLogger.info(`[DailySync]   - Failed: ${candidates.filter(c => c.sync_status === 'failed').length}`);
  zohoLogger.info(`[DailySync]   - Never synced: ${candidates.filter(c => !c.last_synced_at).length}`);
  zohoLogger.info(`[DailySync]   - Stale: ${candidates.filter(c => c.last_synced_at && c.sync_status !== 'failed').length}\n`);

  if (candidates.length === 0) {
    zohoLogger.info('[DailySync] ✅ No products need syncing. All up to date!\n');
    return {
      totalCandidates: 0,
      processed: 0,
      crmSucceeded: 0,
      crmFailed: 0,
      billingSucceeded: 0,
      billingFailed: 0,
      skipped: 0,
      duration: Date.now() - startTime,
      results: [],
    };
  }

  if (options.dryRun) {
    zohoLogger.info('[DailySync] DRY RUN MODE - Would sync these products:');
    candidates.forEach((c, i) => {
      zohoLogger.info(`[DailySync]   ${i + 1}. ${c.sku} - ${c.name}`);
    });
    zohoLogger.debug('');
    return {
      totalCandidates: candidates.length,
      processed: 0,
      crmSucceeded: 0,
      crmFailed: 0,
      billingSucceeded: 0,
      billingFailed: 0,
      skipped: candidates.length,
      duration: Date.now() - startTime,
      results: [],
    };
  }

  // 2. Process in batches
  zohoLogger.info('[DailySync] Step 2: Processing products in batches...\n');

  const batches: SyncCandidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  const results: SyncResult[] = [];
  let processed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    zohoLogger.info(`[DailySync] Batch ${batchIndex + 1}/${batches.length} (${batch.length} products)\n`);

    for (let i = 0; i < batch.length; i++) {
      const candidate = batch[i];
      const productNum = processed + 1;

      zohoLogger.info(`[DailySync] [${productNum}/${candidates.length}] ${candidate.sku} - ${candidate.name}`);

      const result = await syncProduct(candidate);
      results.push(result);
      processed++;

      // Log result
      const crmIcon = result.crmSuccess ? '✅' : '❌';
      const billingIcon = result.billingSuccess ? '✅' : '❌';
      zohoLogger.info(`[DailySync]   CRM: ${crmIcon} | Billing: ${billingIcon}`);

      if (result.crmError) {
        zohoLogger.info(`[DailySync]   CRM Error: ${result.crmError}`);
      }
      if (result.billingError) {
        zohoLogger.info(`[DailySync]   Billing Error: ${result.billingError}`);
      }

      zohoLogger.debug(''); // Empty line for readability

      // Delay between products (rate limiting)
      if (i < batch.length - 1) {
        await sleep(PRODUCT_DELAY_MS);
      }
    }

    // Delay between batches
    if (batchIndex < batches.length - 1) {
      zohoLogger.info(`[DailySync] ⏸️  Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  // 3. Generate summary
  const duration = Date.now() - startTime;
  const summary: DailySyncSummary = {
    totalCandidates: candidates.length,
    processed,
    crmSucceeded: results.filter(r => r.crmSuccess).length,
    crmFailed: results.filter(r => !r.crmSuccess).length,
    billingSucceeded: results.filter(r => r.billingSuccess).length,
    billingFailed: results.filter(r => !r.billingSuccess).length,
    skipped: 0,
    duration,
    results,
  };

  // Print summary
  zohoLogger.info('\n[DailySync] ═══════════════════════════════════════════════════════════');
  zohoLogger.info('[DailySync]   Daily Sync Summary');
  zohoLogger.info('[DailySync] ═══════════════════════════════════════════════════════════\n');
  zohoLogger.info(`[DailySync]   Total Candidates: ${summary.totalCandidates}`);
  zohoLogger.info(`[DailySync]   Processed: ${summary.processed}`);
  zohoLogger.info(`[DailySync]   CRM: ✅ ${summary.crmSucceeded} | ❌ ${summary.crmFailed}`);
  zohoLogger.info(`[DailySync]   Billing: ✅ ${summary.billingSucceeded} | ❌ ${summary.billingFailed}`);
  zohoLogger.info(`[DailySync]   Duration: ${(summary.duration / 1000).toFixed(1)}s`);
  zohoLogger.info('[DailySync] ═══════════════════════════════════════════════════════════\n');

  // Log rate limiter stats
  const stats = rateLimiter.getStats();
  zohoLogger.info('[DailySync] Rate Limiter Stats:');
  zohoLogger.info(`[DailySync]   OAuth: ${stats.oauth.current}/${stats.oauth.limit} (${stats.oauth.remaining} remaining)`);
  zohoLogger.info(`[DailySync]   CRM: ${stats.crm.current}/${stats.crm.limit} (${stats.crm.remaining} remaining)`);
  zohoLogger.info(`[DailySync]   Billing: ${stats.billing.current}/${stats.billing.limit} (${stats.billing.remaining} remaining)\n`);

  return summary;
}
