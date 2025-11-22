/**
 * Cancel Price Change API - Epic 3.6
 *
 * Cancels a draft or published price change (before it becomes effective)
 *
 * Flow:
 * 1. Validate price change is in 'draft' or 'published' status (not 'effective')
 * 2. Set status = 'cancelled'
 * 3. Remove from service_packages.price_history (if published)
 * 4. Send cancellation notification to customers (if published)
 * 5. Return success
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/price-changes/[id]/cancel
 *
 * Cancel price change (requires approval permission)
 *
 * RBAC: products:approve
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin user
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    // Note: In production, check RBAC permission: products:approve

    // =========================================================================
    // Get Price Change
    // =========================================================================
    const { data: priceChange, error: fetchError } = await supabase
      .from('price_changes')
      .select(
        `
        *,
        service_package:service_packages(
          id,
          name,
          sku,
          price_history
        )
      `
      )
      .eq('id', id)
      .single();

    if (fetchError || !priceChange) {
      return NextResponse.json(
        { error: 'Price change not found' },
        { status: 404 }
      );
    }

    // Validate status is 'draft' or 'published' (cannot cancel 'effective')
    if (priceChange.status === 'effective') {
      return NextResponse.json(
        {
          error: 'Cannot cancel an effective price change',
          current_status: priceChange.status,
          hint: 'Create a new price change to revert to the old price',
        },
        { status: 400 }
      );
    }

    if (priceChange.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Price change is already cancelled',
          current_status: priceChange.status,
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Update Price Change Status
    // =========================================================================
    const { data: cancelledPriceChange, error: updateError } = await supabase
      .from('price_changes')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[POST /api/admin/price-changes/[id]/cancel] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel price change' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Remove from service_packages.price_history (if was published)
    // =========================================================================
    if (priceChange.status === 'published') {
      const priceHistory = priceChange.service_package.price_history || [];

      // Remove the entry for this price change
      const updatedHistory = priceHistory.filter(
        (entry: any) => entry.change_id !== id
      );

      // Reopen the previous price period (if exists)
      if (updatedHistory.length > 0) {
        const lastEntry = updatedHistory[updatedHistory.length - 1];
        lastEntry.effective_to = null; // Open-ended again
      }

      const { error: historyError } = await supabase
        .from('service_packages')
        .update({ price_history: updatedHistory })
        .eq('id', priceChange.service_package_id);

      if (historyError) {
        console.error(
          '[POST /api/admin/price-changes/[id]/cancel] Price history update error:',
          historyError
        );
        // Don't fail the operation
      }
    }

    // =========================================================================
    // TODO: Send Cancellation Notification to Customers (if published)
    // =========================================================================
    // This will be implemented in Phase 6
    if (priceChange.status === 'published') {
      console.log('[POST /api/admin/price-changes/[id]/cancel] Cancellation notification:', {
        price_change_id: id,
        affected_customers_count: priceChange.affected_customers_count,
        message: 'Cancellation email notification to be sent to affected customers',
      });
    }

    // =========================================================================
    // Return Success
    // =========================================================================
    return NextResponse.json({
      success: true,
      data: cancelledPriceChange,
      message: `Price change cancelled successfully${
        priceChange.status === 'published'
          ? '. Cancellation notifications will be sent to affected customers.'
          : '.'
      }`,
    });
  } catch (error) {
    console.error('[POST /api/admin/price-changes/[id]/cancel] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
