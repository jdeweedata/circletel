/**
 * Admin B2B Site Details API
 *
 * GET /api/admin/b2b-customers/site-details - List all site details
 *
 * @module app/api/admin/b2b-customers/site-details/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // Use session client for authentication
    const sessionClient = await createClientWithSession();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    // Use service role client for data access
    const supabase = await createClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const rfiStatus = searchParams.get('rfi_status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('business_site_details')
      .select(
        `
        id,
        business_customer_id,
        premises_ownership,
        property_type,
        room_name,
        rfi_status,
        status,
        has_rack_facility,
        has_access_control,
        has_air_conditioning,
        has_ac_power,
        submitted_at,
        created_at,
        business_customers!inner(company_name, account_number)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (rfiStatus && rfiStatus !== 'all') {
      query = query.eq('rfi_status', rfiStatus);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('Error fetching site details', { error });
      return NextResponse.json(
        { error: 'Failed to fetch site details' },
        { status: 500 }
      );
    }

    // Format data
    const formattedData = (data || []).map((item) => {
      const customerData = item.business_customers as unknown as { company_name: string; account_number: string };
      return {
        id: item.id,
        business_customer_id: item.business_customer_id,
        company_name: customerData.company_name,
        account_number: customerData.account_number,
        premises_ownership: item.premises_ownership,
        property_type: item.property_type,
        room_name: item.room_name,
        rfi_status: item.rfi_status,
        status: item.status,
        has_rack_facility: item.has_rack_facility,
        has_access_control: item.has_access_control,
        has_air_conditioning: item.has_air_conditioning,
        has_ac_power: item.has_ac_power,
        submitted_at: item.submitted_at,
        created_at: item.created_at,
      };
    });

    // Get stats
    const { data: allData } = await supabase
      .from('business_site_details')
      .select('status, rfi_status');

    const stats = {
      total: count || 0,
      byStatus: {} as Record<string, number>,
      byRfiStatus: {} as Record<string, number>,
      pending_review: 0,
    };

    allData?.forEach((item) => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      stats.byRfiStatus[item.rfi_status] = (stats.byRfiStatus[item.rfi_status] || 0) + 1;
      if (item.status === 'submitted') {
        stats.pending_review++;
      }
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    apiLogger.error('Error in admin site details API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
