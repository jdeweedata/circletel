/**
 * Price Change Detail API - Epic 3.6
 *
 * Handles individual price change operations:
 * - GET: View price change details
 * - PUT: Update price change (draft only)
 * - DELETE: Delete price change (draft only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/price-changes/[id]
 *
 * Get price change details
 *
 * RBAC: products:read
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // =========================================================================
    // Authentication
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
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    // =========================================================================
    // Get Price Change
    // =========================================================================
    const { data: priceChange, error } = await supabase
      .from('price_changes')
      .select(
        `
        *,
        service_package:service_packages(
          id,
          name,
          sku,
          category,
          price,
          pricing
        ),
        created_by_user:admin_users!price_changes_created_by_fkey(
          id,
          email,
          full_name
        ),
        approved_by_user:admin_users!price_changes_approved_by_fkey(
          id,
          email,
          full_name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !priceChange) {
      return NextResponse.json(
        { error: 'Price change not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: priceChange,
    });
  } catch (error) {
    console.error('[GET /api/admin/price-changes/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/price-changes/[id]
 *
 * Update price change (draft status only)
 *
 * Request body:
 * {
 *   new_price?: number,
 *   effective_date?: 'YYYY-MM-DD',
 *   reason?: string,
 *   admin_notes?: string,
 *   customer_message?: string
 * }
 *
 * RBAC: products:manage_pricing
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // =========================================================================
    // Authentication
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
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    // =========================================================================
    // Get Existing Price Change
    // =========================================================================
    const { data: existingPriceChange, error: fetchError } = await supabase
      .from('price_changes')
      .select('*, service_package:service_packages(price)')
      .eq('id', id)
      .single();

    if (fetchError || !existingPriceChange) {
      return NextResponse.json(
        { error: 'Price change not found' },
        { status: 404 }
      );
    }

    // Only allow updating draft price changes
    if (existingPriceChange.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Can only update draft price changes',
          current_status: existingPriceChange.status,
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Request Body
    // =========================================================================
    const body = await request.json();
    const updates: any = {};

    // Update new_price if provided
    if (body.new_price !== undefined) {
      const currentPrice = existingPriceChange.service_package.price;

      if (body.new_price === currentPrice) {
        return NextResponse.json(
          { error: 'New price must be different from current price' },
          { status: 400 }
        );
      }

      updates.new_price = body.new_price;
      // old_price will be recalculated by trigger
    }

    // Update effective_date if provided
    if (body.effective_date) {
      const effectiveDateObj = new Date(body.effective_date);
      const minEffectiveDate = new Date();
      minEffectiveDate.setDate(minEffectiveDate.getDate() + 60);

      if (effectiveDateObj < minEffectiveDate) {
        return NextResponse.json(
          {
            error:
              'Effective date must be at least 60 days in the future (2-month notice period)',
            min_effective_date: minEffectiveDate.toISOString().split('T')[0],
          },
          { status: 400 }
        );
      }

      updates.effective_date = body.effective_date;
    }

    // Update optional fields
    if (body.reason !== undefined) updates.reason = body.reason;
    if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
    if (body.customer_message !== undefined)
      updates.customer_message = body.customer_message;

    // =========================================================================
    // Update Price Change
    // =========================================================================
    const { data: updatedPriceChange, error: updateError } = await supabase
      .from('price_changes')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        service_package:service_packages(
          id,
          name,
          sku,
          category
        )
      `
      )
      .single();

    if (updateError) {
      console.error('[PUT /api/admin/price-changes/[id]] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update price change' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPriceChange,
      message: 'Price change updated successfully',
    });
  } catch (error) {
    console.error('[PUT /api/admin/price-changes/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/price-changes/[id]
 *
 * Delete price change (draft status only)
 *
 * RBAC: products:approve
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // =========================================================================
    // Authentication
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
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    // =========================================================================
    // Get Existing Price Change
    // =========================================================================
    const { data: existingPriceChange } = await supabase
      .from('price_changes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingPriceChange) {
      return NextResponse.json(
        { error: 'Price change not found' },
        { status: 404 }
      );
    }

    // Only allow deleting draft price changes
    if (existingPriceChange.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Can only delete draft price changes',
          current_status: existingPriceChange.status,
          hint: 'Use cancel endpoint for published price changes',
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Delete Price Change
    // =========================================================================
    const { error: deleteError } = await supabase
      .from('price_changes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE /api/admin/price-changes/[id]] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete price change' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Price change deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/admin/price-changes/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
