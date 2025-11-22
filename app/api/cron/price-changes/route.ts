/**
 * Price Changes Cron Job - Epic 3.6
 *
 * Scheduled job that runs daily at 02:00 SAST
 *
 * Purpose:
 * - Find price changes with effective_date = TODAY and status = 'published'
 * - Update service_packages.price to new_price
 * - Update Zoho Billing Plan price
 * - Update price_changes.status to 'effective'
 * - Update price_history
 *
 * This ensures all customers (new + existing) switch to new price on effective_date
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';

/**
 * GET /api/cron/price-changes
 *
 * Vercel Cron Job - Runs daily at 02:00 SAST
 *
 * Schedule: 0 2 * * * (cron expression)
 *
 * Authentication: Vercel Cron Secret
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // Verify Vercel Cron Secret
    // =========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Price Changes Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Price Changes Cron] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Price Changes Cron] Starting price change job...');

    // =========================================================================
    // Get Today's Date (YYYY-MM-DD)
    // =========================================================================
    const today = new Date().toISOString().split('T')[0];
    console.log('[Price Changes Cron] Checking for price changes effective on:', today);

    // =========================================================================
    // Find Price Changes to Make Effective
    // =========================================================================
    const supabase = await createClient();

    const { data: priceChanges, error: queryError } = await supabase
      .from('price_changes')
      .select(
        `
        *,
        service_package:service_packages(
          id,
          name,
          sku,
          price,
          price_history
        )
      `
      )
      .eq('status', 'published')
      .eq('effective_date', today);

    if (queryError) {
      console.error('[Price Changes Cron] Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch price changes' },
        { status: 500 }
      );
    }

    console.log(`[Price Changes Cron] Found ${priceChanges.length} price changes to process`);

    if (priceChanges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No price changes to process today',
        date: today,
        processed: 0,
      });
    }

    // =========================================================================
    // Process Each Price Change
    // =========================================================================
    const results = [];

    for (const change of priceChanges) {
      const result: any = {
        price_change_id: change.id,
        service_package_id: change.service_package_id,
        package_name: change.service_package?.name,
        old_price: change.old_price,
        new_price: change.new_price,
        success: false,
        error: null,
      };

      try {
        console.log(
          `[Price Changes Cron] Processing: ${change.service_package?.name} (${change.id})`
        );

        // =====================================================================
        // STEP 1: Update service_packages.price in Supabase
        // =====================================================================
        const { error: updatePriceError } = await supabase
          .from('service_packages')
          .update({
            price: change.new_price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.service_package_id);

        if (updatePriceError) {
          throw new Error(`Failed to update package price: ${updatePriceError.message}`);
        }

        console.log(
          `[Price Changes Cron] ✅ Updated package price: R${change.old_price} → R${change.new_price}`
        );

        // =====================================================================
        // STEP 2: Update Zoho Billing Plan price
        // =====================================================================
        const zohoPlanId = change.service_package?.zoho_billing_plan_id;

        if (zohoPlanId) {
          try {
            const zohoBillingClient = new ZohoBillingClient();

            await zohoBillingClient.updatePlan(zohoPlanId, {
              recurring_price: change.new_price,
            });

            console.log(
              `[Price Changes Cron] ✅ Updated Zoho Billing Plan: ${zohoPlanId}`
            );
          } catch (zohoError: any) {
            console.error(
              `[Price Changes Cron] ⚠️  Zoho Billing update failed (non-fatal):`,
              zohoError
            );
            result.zoho_error = zohoError.message;
            // Don't fail the entire operation - price is updated in Supabase
          }
        } else {
          console.log(
            `[Price Changes Cron] ⚠️  No Zoho Plan ID - skipping Zoho update`
          );
        }

        // =====================================================================
        // STEP 3: Update price_changes status to 'effective'
        // =====================================================================
        const { error: updateStatusError } = await supabase
          .from('price_changes')
          .update({
            status: 'effective',
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.id);

        if (updateStatusError) {
          throw new Error(
            `Failed to update price change status: ${updateStatusError.message}`
          );
        }

        console.log(
          `[Price Changes Cron] ✅ Updated price_changes status to 'effective'`
        );

        // =====================================================================
        // STEP 4: Update price_history
        // =====================================================================
        const priceHistory = change.service_package?.price_history || [];

        // Find the entry for this price change and mark it as active
        const historyEntry = priceHistory.find(
          (entry: any) => entry.change_id === change.id
        );

        if (historyEntry) {
          // Entry already exists from publication - just ensure it's correct
          historyEntry.effective_from = today;
          historyEntry.effective_to = null; // Open-ended
        } else {
          // Add new entry (shouldn't happen, but handle it)
          priceHistory.push({
            price: change.new_price,
            effective_from: today,
            effective_to: null,
            change_id: change.id,
            made_effective_at: new Date().toISOString(),
          });
        }

        const { error: historyError } = await supabase
          .from('service_packages')
          .update({ price_history: priceHistory })
          .eq('id', change.service_package_id);

        if (historyError) {
          console.error(
            `[Price Changes Cron] ⚠️  Failed to update price_history:`,
            historyError
          );
          // Don't fail - history is supplementary
        } else {
          console.log(`[Price Changes Cron] ✅ Updated price_history`);
        }

        // =====================================================================
        // SUCCESS
        // =====================================================================
        result.success = true;
        result.message = `Price change made effective: R${change.old_price} → R${change.new_price}`;

        console.log(
          `[Price Changes Cron] ✅ Price change ${change.id} completed successfully`
        );
      } catch (error: any) {
        // =====================================================================
        // ERROR HANDLING
        // =====================================================================
        result.success = false;
        result.error = error.message;

        console.error(
          `[Price Changes Cron] ❌ Failed to process price change ${change.id}:`,
          error
        );

        // Log error to zoho_sync_logs for monitoring
        try {
          await supabase.from('zoho_sync_logs').insert({
            entity_type: 'price_change',
            entity_id: change.id,
            status: 'failed',
            error_message: error.message,
            error_stack: error.stack,
            attempt_number: 1,
          });
        } catch (logError) {
          console.error('[Price Changes Cron] Failed to log error:', logError);
        }
      }

      results.push(result);
    }

    // =========================================================================
    // Return Summary
    // =========================================================================
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[Price Changes Cron] Job completed: ${successCount} succeeded, ${failureCount} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${priceChanges.length} price changes`,
      date: today,
      processed: priceChanges.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });
  } catch (error: any) {
    console.error('[Price Changes Cron] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
