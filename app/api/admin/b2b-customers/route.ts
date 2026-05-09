/**
 * Admin B2B Customers API
 *
 * GET /api/admin/b2b-customers - List all B2B customers with journey status
 *
 * @module app/api/admin/b2b-customers/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { BusinessJourneyService } from '@/lib/business/journey-service';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const kycStatus = searchParams.get('kyc_status') || undefined;
    const stage = searchParams.get('stage') as any || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch customers with journey status
    const { customers, total } = await BusinessJourneyService.getAllCustomersWithJourney({
      status,
      kycStatus,
      stage,
      search,
      limit,
      offset,
    });

    // Calculate summary stats
    const stats = {
      total,
      byStatus: {
        pending_verification: customers.filter(
          (c) => c.account_status === 'pending_verification'
        ).length,
        active: customers.filter((c) => c.account_status === 'active').length,
        suspended: customers.filter((c) => c.account_status === 'suspended').length,
      },
      byStage: {
        quote_request: customers.filter(
          (c) => c.journey?.currentStage === 'quote_request'
        ).length,
        business_verification: customers.filter(
          (c) => c.journey?.currentStage === 'business_verification'
        ).length,
        site_details: customers.filter(
          (c) => c.journey?.currentStage === 'site_details'
        ).length,
        contract: customers.filter((c) => c.journey?.currentStage === 'contract')
          .length,
        installation: customers.filter(
          (c) => c.journey?.currentStage === 'installation'
        ).length,
        go_live: customers.filter((c) => c.journey?.currentStage === 'go_live')
          .length,
      },
      blocked: customers.filter((c) => c.journey?.blockedStage).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        customers,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching B2B customers', { error });
    return NextResponse.json(
      { error: 'Failed to fetch B2B customers' },
      { status: 500 }
    );
  }
}
