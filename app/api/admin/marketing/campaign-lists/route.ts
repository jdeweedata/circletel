/**
 * Admin API: Campaign Lists
 * GET - Generate targetable lists from DFA buildings and Tarana base stations
 *
 * Query Parameters:
 * - source: 'dfa' | 'tarana' (default: 'dfa')
 * - coverage_type: 'connected' | 'near-net' (DFA only)
 * - precinct: Filter by precinct (DFA only)
 * - ftth: Filter by FTTH status (DFA only)
 * - search: Search building name or address
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 500)
 * - format: 'json' | 'summary' (default: 'json')
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const source = searchParams.get('source') || 'dfa';
    const coverageType = searchParams.get('coverage_type') || undefined;
    const precinct = searchParams.get('precinct') || undefined;
    const ftth = searchParams.get('ftth') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 500);
    const format = searchParams.get('format') || 'json';

    if (source === 'dfa') {
      // Build DFA buildings query
      let query = supabase.from('dfa_buildings').select('*', { count: 'exact' });

      if (coverageType) {
        query = query.eq('coverage_type', coverageType);
      }
      if (precinct) {
        query = query.eq('precinct', precinct);
      }
      if (ftth) {
        query = query.eq('ftth', ftth);
      }
      if (search) {
        query = query.or(
          `building_name.ilike.%${search}%,street_address.ilike.%${search}%`
        );
      }

      query = query.order('building_name', { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: buildings, error, count } = await query;

      if (error) {
        apiLogger.error('[Campaign Lists API] DFA query error', {
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch DFA buildings' },
          { status: 500 }
        );
      }

      // Get coverage summary for this filter set
      const [connectedCount, nearNetCount, precinctList] = await Promise.all([
        supabase
          .from('dfa_buildings')
          .select('id', { count: 'exact', head: true })
          .eq('coverage_type', 'connected'),
        supabase
          .from('dfa_buildings')
          .select('id', { count: 'exact', head: true })
          .eq('coverage_type', 'near-net'),
        supabase
          .from('dfa_buildings')
          .select('precinct')
          .not('precinct', 'is', null),
      ]);

      const precinctCounts: Record<string, number> = {};
      precinctList.data?.forEach((s) => {
        const p = s.precinct || 'Unknown';
        precinctCounts[p] = (precinctCounts[p] || 0) + 1;
      });

      const precincts = Object.entries(precinctCounts)
        .map(([name, cnt]) => ({ name, count: cnt }))
        .sort((a, b) => b.count - a.count);

      if (format === 'summary') {
        return NextResponse.json({
          success: true,
          data: {
            source: 'dfa',
            summary: {
              totalBuildings: (connectedCount.count || 0) + (nearNetCount.count || 0),
              connected: connectedCount.count || 0,
              nearNet: nearNetCount.count || 0,
              filteredCount: count || 0,
              precincts,
            },
          },
        });
      }

      const campaignList =
        buildings?.map((b) => ({
          id: b.id,
          buildingName: b.building_name,
          streetAddress: b.street_address,
          coverageType: b.coverage_type,
          ftth: b.ftth,
          broadband: b.broadband,
          precinct: b.precinct,
          promotion: b.promotion,
          latitude: b.latitude,
          longitude: b.longitude,
        })) || [];

      return NextResponse.json({
        success: true,
        data: {
          source: 'dfa',
          items: campaignList,
          summary: {
            totalBuildings: (connectedCount.count || 0) + (nearNetCount.count || 0),
            connected: connectedCount.count || 0,
            nearNet: nearNetCount.count || 0,
            filteredCount: count || 0,
            precincts,
          },
          pagination: {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
        },
      });
    } else if (source === 'tarana') {
      // Query Tarana base stations
      let query = supabase
        .from('tarana_base_stations')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(
          `site_name.ilike.%${search}%,hostname.ilike.%${search}%,market.ilike.%${search}%`
        );
      }

      query = query.order('site_name', { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: stations, error, count } = await query;

      if (error) {
        apiLogger.error('[Campaign Lists API] Tarana query error', {
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch Tarana base stations' },
          { status: 500 }
        );
      }

      // Get market breakdown
      const marketStats = await supabase
        .from('tarana_base_stations')
        .select('market');

      const marketCounts: Record<string, number> = {};
      marketStats.data?.forEach((s) => {
        const market = s.market || 'Unknown';
        marketCounts[market] = (marketCounts[market] || 0) + 1;
      });

      const markets = Object.entries(marketCounts)
        .map(([name, cnt]) => ({ name, count: cnt }))
        .sort((a, b) => b.count - a.count);

      const stationList =
        stations?.map((s) => ({
          id: s.id,
          serialNumber: s.serial_number,
          hostname: s.hostname,
          siteName: s.site_name,
          market: s.market,
          latitude: s.lat,
          longitude: s.lng,
          activeConnections: s.active_connections,
        })) || [];

      return NextResponse.json({
        success: true,
        data: {
          source: 'tarana',
          items: stationList,
          summary: {
            totalStations: count || 0,
            markets,
          },
          pagination: {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid source. Use "dfa" or "tarana".' },
        { status: 400 }
      );
    }
  } catch (error) {
    apiLogger.error('[Campaign Lists API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate campaign list',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
