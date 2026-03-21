import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/map/coverage-layers
 * Returns base stations and DFA buildings within viewport bounds.
 * Used by the map page to render infrastructure overlay layers.
 *
 * Query params:
 *   sw_lat, sw_lng, ne_lat, ne_lng — viewport bounds
 *   layers — comma-separated: "base_stations", "dfa_buildings" (default: both)
 *   dfa_limit — max DFA buildings to return (default: 2000, for clustering)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const swLat = parseFloat(searchParams.get('sw_lat') ?? '-35');
    const swLng = parseFloat(searchParams.get('sw_lng') ?? '16');
    const neLat = parseFloat(searchParams.get('ne_lat') ?? '-22');
    const neLng = parseFloat(searchParams.get('ne_lng') ?? '33');
    const layers = (searchParams.get('layers') ?? 'base_stations,dfa_buildings').split(',');
    const dfaLimit = parseInt(searchParams.get('dfa_limit') ?? '2000', 10);

    const result: {
      base_stations?: Array<Record<string, unknown>>;
      dfa_buildings?: Array<Record<string, unknown>>;
    } = {};

    // Fetch base stations within viewport
    if (layers.includes('base_stations')) {
      const { data: stations, error: bsError } = await supabase
        .from('tarana_base_stations')
        .select('id, serial_number, hostname, site_name, active_connections, market, lat, lng')
        .gte('lat', swLat)
        .lte('lat', neLat)
        .gte('lng', swLng)
        .lte('lng', neLng);

      if (bsError) {
        apiLogger.error('[Sales Engine] Base stations layer query failed', { error: bsError.message });
      }

      result.base_stations = stations ?? [];
    }

    // Fetch DFA buildings within viewport (limited for performance)
    if (layers.includes('dfa_buildings')) {
      const { data: buildings, error: dfaError } = await supabase
        .from('dfa_buildings')
        .select('id, building_name, building_id, street_address, latitude, longitude, coverage_type, ftth, precinct')
        .gte('latitude', swLat)
        .lte('latitude', neLat)
        .gte('longitude', swLng)
        .lte('longitude', neLng)
        .limit(dfaLimit);

      if (dfaError) {
        apiLogger.error('[Sales Engine] DFA buildings layer query failed', { error: dfaError.message });
      }

      result.dfa_buildings = buildings ?? [];
    }

    return NextResponse.json({
      data: result,
      bounds: { sw_lat: swLat, sw_lng: swLng, ne_lat: neLat, ne_lng: neLng },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Coverage layers error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
