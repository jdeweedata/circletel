/**
 * Admin API: No Coverage Leads
 * GET - List leads with filters, pagination, and aggregate stats
 * PATCH - Bulk update lead statuses
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 25, max: 100)
 * - search: Search by name, email, or address
 * - status: Filter by status ('new' | 'contacted' | 'qualified' | 'converted' | 'declined')
 * - service_type: Filter by service type
 * - urgency: Filter by urgency ('low' | 'medium' | 'high')
 * - dateFrom: Filter from date (ISO string)
 * - dateTo: Filter to date (ISO string)
 * - sortBy: Sort field (default: 'created_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NoCoverageLeadQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  service_type?: string;
  urgency?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const params: NoCoverageLeadQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '25'), 100),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      service_type: searchParams.get('service_type') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Build query
    let query = supabase.from('no_coverage_leads').select('*', { count: 'exact' });

    if (params.search) {
      query = query.or(
        `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,address.ilike.%${params.search}%`
      );
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.service_type) {
      query = query.eq('service_type', params.service_type);
    }

    if (params.urgency) {
      query = query.eq('urgency', params.urgency);
    }

    if (params.dateFrom) {
      query = query.gte('created_at', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('created_at', params.dateTo);
    }

    query = query.order(params.sortBy, {
      ascending: params.sortOrder === 'asc',
      nullsFirst: false,
    });

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data: leads, error, count } = await query;

    if (error) {
      apiLogger.error('[No Coverage Leads API] Database error', {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads', details: error.message },
        { status: 500 }
      );
    }

    // Fetch aggregate stats
    const [totalStats, newStats, contactedStats, qualifiedStats, convertedStats] =
      await Promise.all([
        supabase
          .from('no_coverage_leads')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('no_coverage_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),
        supabase
          .from('no_coverage_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'contacted'),
        supabase
          .from('no_coverage_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'qualified'),
        supabase
          .from('no_coverage_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'converted'),
      ]);

    // Count new this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeekStats = await supabase
      .from('no_coverage_leads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .gte('created_at', weekAgo.toISOString());

    // Service type breakdown
    const serviceTypeStats = await supabase
      .from('no_coverage_leads')
      .select('service_type');

    const serviceTypeCounts: Record<string, number> = {};
    serviceTypeStats.data?.forEach((s) => {
      const sType = s.service_type || 'unknown';
      serviceTypeCounts[sType] = (serviceTypeCounts[sType] || 0) + 1;
    });

    const serviceTypes = Object.entries(serviceTypeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const transformedLeads =
      leads?.map((lead) => ({
        id: lead.id,
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        latitude: lead.latitude,
        longitude: lead.longitude,
        serviceType: lead.service_type,
        expectedUsage: lead.expected_usage,
        budgetRange: lead.budget_range,
        urgency: lead.urgency,
        notes: lead.notes,
        marketingConsent: lead.marketing_consent,
        source: lead.source,
        status: lead.status,
        contactedAt: lead.contacted_at,
        convertedAt: lead.converted_at,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        leads: transformedLeads,
        stats: {
          total: totalStats.count || 0,
          new: newStats.count || 0,
          newThisWeek: newThisWeekStats.count || 0,
          contacted: contactedStats.count || 0,
          qualified: qualifiedStats.count || 0,
          converted: convertedStats.count || 0,
          conversionRate:
            (totalStats.count || 0) > 0
              ? Math.round(
                  ((convertedStats.count || 0) / (totalStats.count || 1)) * 100
                )
              : 0,
          serviceTypes,
        },
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.pageSize),
        },
      },
    });
  } catch (error) {
    apiLogger.error('[No Coverage Leads API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { ids, status } = body as { ids: string[]; status: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: ids (array of lead IDs)' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'declined'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'contacted') {
      updateData.contacted_at = new Date().toISOString();
    } else if (status === 'converted') {
      updateData.converted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('no_coverage_leads')
      .update(updateData)
      .in('id', ids)
      .select('id, status');

    if (error) {
      apiLogger.error('[No Coverage Leads API] Update error', {
        error: error.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to update leads', details: error.message },
        { status: 500 }
      );
    }

    apiLogger.info('[No Coverage Leads API] Bulk status update', {
      count: data?.length || 0,
      status,
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: data?.length || 0,
        status,
      },
    });
  } catch (error) {
    apiLogger.error('[No Coverage Leads API] Update error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
