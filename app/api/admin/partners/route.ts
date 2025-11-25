/**
 * Admin Partners List API
 * GET /api/admin/partners
 *
 * Returns paginated list of partners with optional filters.
 * Permission: partners_admin:view_all (or any admin can view if no specific permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

interface PartnerStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  under_review: number;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = await createClient();

    // Build the query
    let query = supabase
      .from('partners')
      .select(
        `
        id,
        partner_number,
        business_name,
        business_type,
        contact_person,
        email,
        phone,
        city,
        province,
        status,
        compliance_status,
        tier,
        commission_rate,
        created_at,
        updated_at,
        approved_at
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,partner_number.ilike.%${search}%`
      );
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: partners, error, count } = await query;

    if (error) {
      console.error('[Admin Partners API] Query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch partners', details: error.message },
        { status: 500 }
      );
    }

    // Get stats for all partners (regardless of filters)
    const { data: allPartners, error: statsError } = await supabase
      .from('partners')
      .select('status');

    let stats: PartnerStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
      under_review: 0,
    };

    if (!statsError && allPartners) {
      stats.total = allPartners.length;
      stats.pending = allPartners.filter((p) => p.status === 'pending').length;
      stats.approved = allPartners.filter((p) => p.status === 'approved').length;
      stats.rejected = allPartners.filter((p) => p.status === 'rejected').length;
      stats.suspended = allPartners.filter((p) => p.status === 'suspended').length;
      stats.under_review = allPartners.filter((p) => p.status === 'under_review').length;
    }

    return NextResponse.json({
      success: true,
      data: partners || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Partners API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
