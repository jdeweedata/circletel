/**
 * Admin API: Tarana Base Stations
 * GET - List all base stations with stats and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface BaseStationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  market?: string;
  sortBy: 'site_name' | 'active_connections' | 'market' | 'distance_km';
  sortOrder: 'asc' | 'desc';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: BaseStationQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '25'), 100),
      search: searchParams.get('search') || undefined,
      market: searchParams.get('market') || undefined,
      sortBy: (searchParams.get('sortBy') as BaseStationQueryParams['sortBy']) || 'active_connections',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Build base query
    let query = supabase
      .from('tarana_base_stations')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (params.search) {
      query = query.or(
        `site_name.ilike.%${params.search}%,hostname.ilike.%${params.search}%,market.ilike.%${params.search}%`
      );
    }

    // Apply market filter
    if (params.market) {
      query = query.eq('market', params.market);
    }

    // Apply sorting
    query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });

    // Apply pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data: stations, error, count } = await query;

    if (error) {
      console.error('[BaseStations API] Database error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch base stations', details: error.message },
        { status: 500 }
      );
    }

    // Fetch aggregate stats (separate query for performance)
    const { data: statsData, error: statsError } = await supabase
      .from('tarana_base_stations')
      .select('active_connections, market');

    if (statsError) {
      console.error('[BaseStations API] Stats error:', statsError.message);
    }

    // Calculate stats
    const totalStations = count || 0;
    const totalConnections = statsData?.reduce((sum, s) => sum + (s.active_connections || 0), 0) || 0;
    const avgConnections = totalStations > 0 ? totalConnections / totalStations : 0;

    // Calculate market breakdown
    const marketCounts: Record<string, number> = {};
    statsData?.forEach((s) => {
      const market = s.market || 'Unknown';
      marketCounts[market] = (marketCounts[market] || 0) + 1;
    });

    const markets = Object.entries(marketCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Transform stations data
    const transformedStations = stations?.map((station) => ({
      id: station.id,
      serialNumber: station.serial_number,
      hostname: station.hostname,
      siteName: station.site_name,
      activeConnections: station.active_connections,
      market: station.market,
      lat: parseFloat(station.lat),
      lng: parseFloat(station.lng),
      region: station.region,
      lastUpdated: station.last_updated,
      createdAt: station.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        stations: transformedStations,
        stats: {
          totalStations,
          totalConnections,
          avgConnections: parseFloat(avgConnections.toFixed(1)),
          marketCount: markets.length,
          markets,
        },
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total: totalStations,
          totalPages: Math.ceil(totalStations / params.pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[BaseStations API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch base stations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
