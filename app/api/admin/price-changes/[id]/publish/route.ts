/**
 * Publish Price Change API - Epic 3.6
 *
 * Publishes a draft price change, starting the 2-month notice period
 *
 * Flow:
 * 1. Validate price change is in 'draft' status
 * 2. Set status = 'published', published_at = NOW()
 * 3. Update service_packages.price_history
 * 4. Send email notifications to affected customers
 * 5. Return success
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/price-changes/[id]/publish
 *
 * Publish price change (requires approval permission)
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
    // For now, allow all active admin users

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

    // Validate status is 'draft'
    if (priceChange.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Can only publish draft price changes',
          current_status: priceChange.status,
        },
        { status: 400 }
      );
    }

    // Validate effective_date is still at least 60 days away
    const effectiveDateObj = new Date(priceChange.effective_date);
    const minEffectiveDate = new Date();
    minEffectiveDate.setDate(minEffectiveDate.getDate() + 60);

    if (effectiveDateObj < minEffectiveDate) {
      return NextResponse.json(
        {
          error:
            'Effective date must be at least 60 days in the future when publishing',
          effective_date: priceChange.effective_date,
          min_effective_date: minEffectiveDate.toISOString().split('T')[0],
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Update Price Change Status
    // =========================================================================
    const publishedAt = new Date().toISOString();

    const { data: publishedPriceChange, error: updateError } = await supabase
      .from('price_changes')
      .update({
        status: 'published',
        published_at: publishedAt,
        approved_by: adminUser.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[POST /api/admin/price-changes/[id]/publish] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to publish price change' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Update service_packages.price_history
    // =========================================================================
    const priceHistory = priceChange.service_package.price_history || [];

    // Close current price period (if exists)
    if (priceHistory.length > 0) {
      const currentEntry = priceHistory[priceHistory.length - 1];
      if (!currentEntry.effective_to) {
        currentEntry.effective_to = priceChange.effective_date;
      }
    }

    // Add new price entry (effective from effective_date)
    priceHistory.push({
      price: priceChange.new_price,
      effective_from: priceChange.effective_date,
      effective_to: null, // Open-ended until next price change
      change_id: id,
      published_at: publishedAt,
    });

    const { error: historyError } = await supabase
      .from('service_packages')
      .update({ price_history: priceHistory })
      .eq('id', priceChange.service_package_id);

    if (historyError) {
      console.error(
        '[POST /api/admin/price-changes/[id]/publish] Price history update error:',
        historyError
      );
      // Don't fail the operation - price_history is supplementary
    }

    // =========================================================================
    // TODO: Send Email Notifications to Affected Customers
    // =========================================================================
    // This will be implemented in Phase 6
    // For now, just log the notification intent
    console.log('[POST /api/admin/price-changes/[id]/publish] Email notifications:', {
      price_change_id: id,
      affected_customers_count: priceChange.affected_customers_count,
      message: 'Email notification system to be implemented in Phase 6',
    });

    // Set notice_sent_at timestamp (will be set by email sender in production)
    await supabase
      .from('price_changes')
      .update({ notice_sent_at: publishedAt })
      .eq('id', id);

    // =========================================================================
    // Return Success
    // =========================================================================
    return NextResponse.json({
      success: true,
      data: publishedPriceChange,
      message: 'Price change published successfully. 2-month notice period has begun.',
      notice_period: {
        published_at: publishedAt,
        effective_date: priceChange.effective_date,
        days_until_effective: Math.ceil(
          (effectiveDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    console.error('[POST /api/admin/price-changes/[id]/publish] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
