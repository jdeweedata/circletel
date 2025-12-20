/**
 * Admin Diagnostics API - List Endpoint
 *
 * GET /api/admin/diagnostics - List all subscriber diagnostics
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  DiagnosticsListParams,
  DiagnosticsListResponse,
  HealthStatus,
} from '@/lib/diagnostics/types'

/**
 * GET /api/admin/diagnostics
 *
 * List all subscriber diagnostics with pagination, filtering, and sorting
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - health_status: Filter by status (healthy, warning, critical, offline, unknown, all)
 * - sort_by: Sort column (health_score, last_check_at, lost_carrier_count_today, customer_name)
 * - sort_order: Sort direction (asc, desc)
 * - search: Search by customer name, email, or subscriber ID
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const params: DiagnosticsListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      health_status: (searchParams.get('health_status') || 'all') as HealthStatus | 'all',
      sort_by: (searchParams.get('sort_by') || 'health_score') as DiagnosticsListParams['sort_by'],
      sort_order: (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc',
      search: searchParams.get('search') || undefined,
    }

    // Build query from view
    let query = supabase
      .from('v_subscriber_diagnostics_summary')
      .select('*', { count: 'exact' })

    // Apply health status filter
    if (params.health_status && params.health_status !== 'all') {
      query = query.eq('health_status', params.health_status)
    }

    // Apply search filter
    if (params.search) {
      const searchTerm = `%${params.search}%`
      query = query.or(
        `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},interstellio_subscriber_id.ilike.${searchTerm}`
      )
    }

    // Apply sorting
    const sortColumn = params.sort_by || 'health_score'
    const sortAsc = params.sort_order === 'asc'

    // Map sort column to actual column names
    const sortColumnMap: Record<string, string> = {
      health_score: 'health_score',
      last_check_at: 'last_check_at',
      lost_carrier_count_today: 'lost_carrier_count_today',
      customer_name: 'customer_name',
    }

    const actualSortColumn = sortColumnMap[sortColumn] || 'health_score'
    query = query.order(actualSortColumn, {
      ascending: sortAsc,
      nullsFirst: false,
    })

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const offset = (page - 1) * limit

    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, count, error } = await query

    if (error) {
      console.error('[Admin Diagnostics] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch diagnostics' },
        { status: 500 }
      )
    }

    // Get stats for all statuses
    const { data: statsData } = await supabase
      .from('subscriber_diagnostics')
      .select('health_status')

    const stats = {
      total: statsData?.length || 0,
      healthy: statsData?.filter((d) => d.health_status === 'healthy').length || 0,
      warning: statsData?.filter((d) => d.health_status === 'warning').length || 0,
      critical: statsData?.filter((d) => d.health_status === 'critical').length || 0,
      offline: statsData?.filter((d) => d.health_status === 'offline').length || 0,
      unknown: statsData?.filter((d) => d.health_status === 'unknown').length || 0,
    }

    const response: DiagnosticsListResponse = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      stats,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Admin Diagnostics] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
