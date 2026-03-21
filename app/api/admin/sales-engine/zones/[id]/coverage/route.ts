import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { enrichZoneCoverage } from '@/lib/sales-engine/coverage-enrichment-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/zones/[id]/coverage
 * Get detailed coverage infrastructure data for a zone.
 * Returns base stations and DFA buildings within the zone's radius.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch the zone
    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, name, center_lat, center_lng, radius_km, base_station_count, base_station_connections, dfa_connected_count, dfa_near_net_count, coverage_confidence, coverage_score, enriched_zone_score, coverage_enriched_at')
      .eq('id', id)
      .single();

    if (zoneError) {
      return NextResponse.json(
        { error: zoneError.message, success: false },
        { status: zoneError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    const radiusKm = zone.radius_km ?? 3.0;

    // Fetch actual base stations within radius
    const { data: baseStations, error: bsError } = await supabase.rpc(
      'find_nearest_tarana_base_station',
      { p_lat: zone.center_lat, p_lng: zone.center_lng, p_limit: 50 }
    );

    const nearbyBaseStations = !bsError && Array.isArray(baseStations)
      ? baseStations.filter((bs: { distance_km: number }) => Number(bs.distance_km) <= radiusKm)
      : [];

    // Fetch nearby DFA buildings within radius
    const { data: dfaBuildings, error: dfaError } = await supabase.rpc(
      'find_nearest_dfa_building',
      { p_lat: zone.center_lat, p_lng: zone.center_lng, p_limit: 100 }
    );

    const nearbyDfaBuildings = !dfaError && Array.isArray(dfaBuildings)
      ? dfaBuildings.filter((b: { distance_km: number }) => Number(b.distance_km) <= radiusKm)
      : [];

    return NextResponse.json({
      data: {
        zone: {
          id: zone.id,
          name: zone.name,
          center_lat: zone.center_lat,
          center_lng: zone.center_lng,
          radius_km: radiusKm,
          coverage_confidence: zone.coverage_confidence,
          coverage_score: zone.coverage_score,
          enriched_zone_score: zone.enriched_zone_score,
          coverage_enriched_at: zone.coverage_enriched_at,
        },
        infrastructure: {
          base_stations: {
            count: zone.base_station_count,
            total_connections: zone.base_station_connections,
            details: nearbyBaseStations,
          },
          dfa_buildings: {
            connected_count: zone.dfa_connected_count,
            near_net_count: zone.dfa_near_net_count,
            details: nearbyDfaBuildings,
          },
        },
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone coverage GET error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

/**
 * POST /api/admin/sales-engine/zones/[id]/coverage
 * Refresh coverage data for a single zone by re-running enrichment.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await enrichZoneCoverage(id);

    if (result.error) {
      apiLogger.error('[Sales Engine] Zone coverage enrichment failed', { error: result.error, zone_id: id });
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    apiLogger.info('[Sales Engine] Zone coverage enriched', { zone_id: id, data: result.data });
    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone coverage POST error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
