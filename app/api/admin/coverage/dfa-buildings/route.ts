/**
 * Admin API: DFA Buildings
 * GET - List all DFA buildings with stats and pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 25, max: 100)
 * - search: Search by building name, ID, or address
 * - type: Coverage type filter ('connected' | 'near-net')
 * - precinct: Precinct filter
 * - ftth: FTTH filter ('Yes' | 'No')
 * - broadband: Broadband filter ('Yes' | 'No')
 * - sortBy: Sort field (default: 'building_name')
 * - sortOrder: 'asc' | 'desc' (default: 'asc')
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DFABuildingQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  type?: 'connected' | 'near-net';
  precinct?: string;
  ftth?: string;
  broadband?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: DFABuildingQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '25'), 100),
      search: searchParams.get('search') || undefined,
      type: (searchParams.get('type') as 'connected' | 'near-net') || undefined,
      precinct: searchParams.get('precinct') || undefined,
      ftth: searchParams.get('ftth') || undefined,
      broadband: searchParams.get('broadband') || undefined,
      sortBy: searchParams.get('sortBy') || 'building_name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    // Build base query
    let query = supabase.from('dfa_buildings').select('*', { count: 'exact' });

    // Apply search filter (building_name, building_id, street_address)
    if (params.search) {
      query = query.or(
        `building_name.ilike.%${params.search}%,building_id.ilike.%${params.search}%,street_address.ilike.%${params.search}%`
      );
    }

    // Apply coverage type filter
    if (params.type) {
      query = query.eq('coverage_type', params.type);
    }

    // Apply precinct filter
    if (params.precinct) {
      query = query.eq('precinct', params.precinct);
    }

    // Apply FTTH filter
    if (params.ftth) {
      query = query.eq('ftth', params.ftth);
    }

    // Apply broadband filter
    if (params.broadband) {
      query = query.eq('broadband', params.broadband);
    }

    // Apply sorting
    query = query.order(params.sortBy, {
      ascending: params.sortOrder === 'asc',
      nullsFirst: false,
    });

    // Apply pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data: buildings, error, count } = await query;

    if (error) {
      apiLogger.error('[DFA Buildings API] Database error', {
        error: error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch DFA buildings',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Fetch aggregate stats (separate query for performance)
    const [connectedStats, nearNetStats, precinctStats, lastSyncLog] =
      await Promise.all([
        // Count connected buildings
        supabase
          .from('dfa_buildings')
          .select('id', { count: 'exact', head: true })
          .eq('coverage_type', 'connected'),
        // Count near-net buildings
        supabase
          .from('dfa_buildings')
          .select('id', { count: 'exact', head: true })
          .eq('coverage_type', 'near-net'),
        // Get distinct precincts with counts
        supabase.from('dfa_buildings').select('precinct').not('precinct', 'is', null),
        // Get last sync log
        supabase
          .from('dfa_sync_logs')
          .select('id, status, connected_count, near_net_count, duration_ms, completed_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    // Calculate precinct breakdown
    const precinctCounts: Record<string, number> = {};
    precinctStats.data?.forEach((s) => {
      const precinct = s.precinct || 'Unknown';
      precinctCounts[precinct] = (precinctCounts[precinct] || 0) + 1;
    });

    const precincts = Object.entries(precinctCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Transform buildings data
    const transformedBuildings =
      buildings?.map((building) => ({
        id: building.id,
        objectId: building.object_id,
        buildingId: building.building_id,
        buildingName: building.building_name,
        streetAddress: building.street_address,
        latitude: building.latitude,
        longitude: building.longitude,
        coverageType: building.coverage_type,
        ftth: building.ftth,
        broadband: building.broadband,
        precinct: building.precinct,
        promotion: building.promotion,
        propertyOwner: building.property_owner,
        lastSyncedAt: building.last_synced_at,
        createdAt: building.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        buildings: transformedBuildings,
        stats: {
          totalBuildings: (connectedStats.count || 0) + (nearNetStats.count || 0),
          connectedCount: connectedStats.count || 0,
          nearNetCount: nearNetStats.count || 0,
          precinctCount: precincts.length,
          precincts,
          lastSync: lastSyncLog.data
            ? {
                id: lastSyncLog.data.id,
                status: lastSyncLog.data.status,
                connectedCount: lastSyncLog.data.connected_count,
                nearNetCount: lastSyncLog.data.near_net_count,
                durationMs: lastSyncLog.data.duration_ms,
                completedAt: lastSyncLog.data.completed_at,
              }
            : null,
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
    apiLogger.error('[DFA Buildings API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DFA buildings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
