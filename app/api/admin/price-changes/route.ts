/**
 * Price Changes API - Epic 3.6
 *
 * Handles scheduled price changes with 2-month notice period
 *
 * Business Logic:
 * - Admin creates price change (draft status)
 * - Admin publishes price change (2-month notice begins)
 * - New customers (signup after publication) get new price immediately
 * - Existing customers keep old price until effective_date
 * - On effective_date, all customers switch to new price
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/price-changes
 *
 * List price changes with filters
 *
 * Query params:
 * - status: draft|published|effective|cancelled
 * - service_package_id: UUID
 * - from_date: YYYY-MM-DD (effective_date >=)
 * - to_date: YYYY-MM-DD (effective_date <=)
 *
 * RBAC: products:read
 */
export async function GET(request: NextRequest) {
  try {
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
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminUser?.is_active) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    // =========================================================================
    // Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const servicePackageId = searchParams.get('service_package_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // =========================================================================
    // Build Query
    // =========================================================================
    let query = supabase
      .from('price_changes')
      .select(`
        *,
        service_package:service_packages(
          id,
          name,
          sku,
          category,
          price
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
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (servicePackageId) {
      query = query.eq('service_package_id', servicePackageId);
    }

    if (fromDate) {
      query = query.gte('effective_date', fromDate);
    }

    if (toDate) {
      query = query.lte('effective_date', toDate);
    }

    const { data: priceChanges, error } = await query;

    if (error) {
      console.error('[GET /api/admin/price-changes] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price changes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: priceChanges,
      count: priceChanges.length,
    });
  } catch (error) {
    console.error('[GET /api/admin/price-changes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/price-changes
 *
 * Create new price change (draft status)
 *
 * Request body:
 * {
 *   service_package_id: UUID,
 *   new_price: number,
 *   effective_date: 'YYYY-MM-DD',
 *   reason: string,
 *   admin_notes: string (optional),
 *   customer_message: string (optional)
 * }
 *
 * RBAC: products:manage_pricing
 */
export async function POST(request: NextRequest) {
  try {
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

    // Note: In production, check RBAC permission: products:manage_pricing
    // For now, allow all active admin users

    // =========================================================================
    // Request Body Validation
    // =========================================================================
    const body = await request.json();
    const {
      service_package_id,
      new_price,
      effective_date,
      reason,
      admin_notes,
      customer_message,
    } = body;

    // Validate required fields
    if (!service_package_id || !new_price || !effective_date) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['service_package_id', 'new_price', 'effective_date'],
        },
        { status: 400 }
      );
    }

    // Validate effective_date is at least 60 days in future
    const effectiveDateObj = new Date(effective_date);
    const minEffectiveDate = new Date();
    minEffectiveDate.setDate(minEffectiveDate.getDate() + 60);

    if (effectiveDateObj < minEffectiveDate) {
      return NextResponse.json(
        {
          error: 'Effective date must be at least 60 days in the future (2-month notice period)',
          min_effective_date: minEffectiveDate.toISOString().split('T')[0],
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Get Current Package Price
    // =========================================================================
    const { data: servicePackage, error: packageError } = await supabase
      .from('service_packages')
      .select('id, name, sku, price')
      .eq('id', service_package_id)
      .single();

    if (packageError || !servicePackage) {
      return NextResponse.json(
        { error: 'Service package not found' },
        { status: 404 }
      );
    }

    const oldPrice = servicePackage.price;

    // Validate new_price is different from current price
    if (new_price === oldPrice) {
      return NextResponse.json(
        { error: 'New price must be different from current price' },
        { status: 400 }
      );
    }

    // =========================================================================
    // Check for Existing Active Price Change
    // =========================================================================
    const { data: existingPriceChange } = await supabase
      .from('price_changes')
      .select('id, status')
      .eq('service_package_id', service_package_id)
      .in('status', ['published', 'effective'])
      .maybeSingle();

    if (existingPriceChange) {
      return NextResponse.json(
        {
          error: 'An active price change already exists for this package',
          existing_price_change_id: existingPriceChange.id,
          status: existingPriceChange.status,
        },
        { status: 409 }
      );
    }

    // =========================================================================
    // Query Affected Customers
    // =========================================================================
    // Count customers who have active subscriptions for this package
    // In production, this would query customer_services or subscriptions table
    // For now, we'll set a placeholder count
    const affectedCustomersCount = 0; // TODO: Implement customer count query

    // =========================================================================
    // Create Price Change (Draft Status)
    // =========================================================================
    const { data: priceChange, error: createError } = await supabase
      .from('price_changes')
      .insert({
        service_package_id,
        old_price: oldPrice,
        new_price,
        effective_date,
        status: 'draft',
        reason,
        admin_notes,
        customer_message,
        affected_customers_count: affectedCustomersCount,
        created_by: adminUser.id,
      })
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

    if (createError) {
      console.error('[POST /api/admin/price-changes] Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create price change' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: priceChange,
      message: 'Price change created successfully (draft status)',
    });
  } catch (error) {
    console.error('[POST /api/admin/price-changes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
