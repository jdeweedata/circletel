/**
 * Zoho Product Sync - Retry Service (Epic 2.5)
 *
 * Enhanced retry logic with:
 * - Exponential backoff (5min, 15min, 1hr, 4hr, 24hr)
 * - Structured error logging with full context
 * - Retry queue processing
 * - Maximum retry limit (5 attempts)
 */

import { createClient } from '@/lib/supabase/server';
import { syncServicePackageToZohoCRM } from './product-sync-service';
import type { Product as ServicePackage } from '@/lib/types/products';

const MAX_RETRY_ATTEMPTS = 5;

// Exponential backoff intervals (in minutes)
const RETRY_INTERVALS = [
  5,    // 1st retry: 5 minutes
  15,   // 2nd retry: 15 minutes
  60,   // 3rd retry: 1 hour
  240,  // 4th retry: 4 hours
  1440, // 5th retry: 24 hours
];

interface StructuredError {
  message: string;
  code?: string;
  httpStatus?: number;
  timestamp: string;
  attemptNumber: number;
  payload?: Record<string, unknown>;
  stack?: string;
}

/**
 * Calculate next retry timestamp based on attempt number
 */
function calculateNextRetryAt(attemptNumber: number): Date | null {
  if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
    return null; // No more retries
  }

  const intervalMinutes = RETRY_INTERVALS[attemptNumber] || RETRY_INTERVALS[RETRY_INTERVALS.length - 1];
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + intervalMinutes);

  return nextRetry;
}

/**
 * Build structured error object with full context
 */
function buildStructuredError(
  error: unknown,
  attemptNumber: number,
  servicePackage: ServicePackage
): StructuredError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Extract HTTP status code from error message
  let httpStatus: number | undefined;
  const statusMatch = errorMessage.match(/(\d{3})/);
  if (statusMatch) {
    httpStatus = parseInt(statusMatch[1], 10);
  }

  // Extract error code (e.g., "invalid_client", "INVALID_DATA")
  let errorCode: string | undefined;
  const codeMatch = errorMessage.match(/error[:\s]+([A-Z_]+)/i);
  if (codeMatch) {
    errorCode = codeMatch[1];
  }

  return {
    message: errorMessage,
    code: errorCode,
    httpStatus,
    timestamp: new Date().toISOString(),
    attemptNumber,
    payload: {
      productId: servicePackage.id,
      productName: servicePackage.name,
      sku: servicePackage.sku,
      status: servicePackage.status,
    },
    stack: errorStack,
  };
}

/**
 * Update product_integrations row with retry information
 */
async function updateRetryStatus(params: {
  servicePackageId: string;
  adminProductId: string | null;
  retryCount: number;
  nextRetryAt: Date | null;
  errorDetails: StructuredError;
  zohoProductId?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('product_integrations')
    .upsert(
      {
        service_package_id: params.servicePackageId,
        admin_product_id: params.adminProductId,
        zoho_crm_product_id: params.zohoProductId ?? null,
        sync_status: 'failed',
        last_synced_at: now,
        last_sync_error: params.errorDetails.message,
        sync_error_details: params.errorDetails,
        retry_count: params.retryCount,
        next_retry_at: params.nextRetryAt?.toISOString() ?? null,
        last_retry_at: now,
      },
      {
        onConflict: 'service_package_id',
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error('[ZohoRetryService] Failed to update retry status:', error);
  }
}

/**
 * Sync with enhanced retry tracking
 *
 * This wraps the base sync function with retry logic.
 * On failure, it:
 * 1. Builds structured error details
 * 2. Calculates next retry timestamp using exponential backoff
 * 3. Updates product_integrations with retry information
 */
export async function syncWithRetry(
  servicePackage: ServicePackage,
  currentAttempt: number = 0
): Promise<{ success: boolean; zohoProductId?: string; error?: string }> {
  console.log(`[ZohoRetryService] Syncing product ${servicePackage.id} (attempt ${currentAttempt + 1}/${MAX_RETRY_ATTEMPTS})`);

  try {
    // Call the base sync function
    const result = await syncServicePackageToZohoCRM(servicePackage);

    if (result.success) {
      console.log(`[ZohoRetryService] ✓ Sync successful for ${servicePackage.id}`);
      return result;
    }

    throw new Error(result.error || 'Sync failed without error message');
  } catch (error) {
    console.error(`[ZohoRetryService] ✗ Sync failed for ${servicePackage.id}:`, error);

    const structuredError = buildStructuredError(error, currentAttempt, servicePackage);
    const nextRetryAt = calculateNextRetryAt(currentAttempt);

    // Update retry status in database
    await updateRetryStatus({
      servicePackageId: servicePackage.id,
      adminProductId: servicePackage.source_admin_product_id ?? null,
      retryCount: currentAttempt,
      nextRetryAt,
      errorDetails: structuredError,
    });

    if (nextRetryAt) {
      console.log(
        `[ZohoRetryService] ⏰ Retry scheduled for ${servicePackage.id} at ${nextRetryAt.toISOString()} ` +
        `(attempt ${currentAttempt + 1}/${MAX_RETRY_ATTEMPTS})`
      );
    } else {
      console.error(
        `[ZohoRetryService] ⚠️ Max retries reached for ${servicePackage.id}. No more retries will be attempted.`
      );
    }

    return {
      success: false,
      error: structuredError.message,
    };
  }
}

/**
 * Fetch products that are due for retry
 */
export async function getRetryQueue(): Promise<ServicePackage[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Query product_integrations for failed syncs that are due for retry
  const { data: integrations, error: intError } = await supabase
    .from('product_integrations')
    .select('service_package_id, retry_count')
    .eq('sync_status', 'failed')
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', now)
    .lt('retry_count', MAX_RETRY_ATTEMPTS)
    .order('next_retry_at', { ascending: true })
    .limit(50); // Process max 50 at a time

  if (intError || !integrations || integrations.length === 0) {
    return [];
  }

  const packageIds = integrations.map(i => i.service_package_id);

  // Fetch the actual service_packages
  const { data: packages, error: pkgError } = await supabase
    .from('service_packages')
    .select('*')
    .in('id', packageIds);

  if (pkgError || !packages) {
    console.error('[ZohoRetryService] Failed to fetch service packages for retry:', pkgError);
    return [];
  }

  // Enrich packages with retry count
  const enrichedPackages = packages.map(pkg => {
    const integration = integrations.find(i => i.service_package_id === pkg.id);
    return {
      ...pkg,
      _retryCount: integration?.retry_count ?? 0,
    };
  });

  return enrichedPackages as ServicePackage[];
}

/**
 * Process retry queue (for use in cron jobs or manual triggers)
 */
export async function processRetryQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log('[ZohoRetryService] 🔄 Processing retry queue...');

  const queue = await getRetryQueue();

  if (queue.length === 0) {
    console.log('[ZohoRetryService] No products in retry queue');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log(`[ZohoRetryService] Found ${queue.length} products to retry`);

  let succeeded = 0;
  let failed = 0;

  for (const product of queue) {
    const retryCount = (product as any)._retryCount || 0;
    const result = await syncWithRetry(product, retryCount + 1);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Add small delay between retries to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(
    `[ZohoRetryService] ✅ Retry queue processed: ${succeeded} succeeded, ${failed} failed`
  );

  return {
    processed: queue.length,
    succeeded,
    failed,
  };
}
