import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { enrichZoneDemographics } from '@/lib/sales-engine/demographic-enrichment-service';
import { getProvinceMarketContext } from '@/lib/sales-engine/market-indicators-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/zones/[id]/demographics
 * Get demographic data for a specific zone.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, name, center_lat, center_lng, radius_km, province, demographic_fit_score, business_poi_density, pct_no_internet, pct_income_target, propensity_score, market_adjusted_propensity, demographic_enriched_at')
      .eq('id', id)
      .single();

    if (zoneError) {
      return NextResponse.json(
        { error: zoneError.message, success: false },
        { status: zoneError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Also fetch overlapping ward details
    const radiusKm = zone.radius_km ?? 3.0;
    const { data: demoData } = await supabase.rpc('get_demographics_in_radius', {
      p_lat: zone.center_lat,
      p_lng: zone.center_lng,
      p_radius_km: radiusKm,
    });

    const demographics = Array.isArray(demoData) ? demoData[0] : demoData;

    // Fetch provincial market context
    let marketContext = null;
    if (zone.province) {
      const mcResult = await getProvinceMarketContext(zone.province);
      if (mcResult.data) {
        marketContext = mcResult.data;
      }
    }

    return NextResponse.json({
      data: {
        zone: {
          id: zone.id,
          name: zone.name,
          center_lat: zone.center_lat,
          center_lng: zone.center_lng,
          radius_km: radiusKm,
          province: zone.province,
          demographic_fit_score: zone.demographic_fit_score,
          business_poi_density: zone.business_poi_density,
          pct_no_internet: zone.pct_no_internet,
          pct_income_target: zone.pct_income_target,
          propensity_score: zone.propensity_score,
          market_adjusted_propensity: zone.market_adjusted_propensity,
          demographic_enriched_at: zone.demographic_enriched_at,
        },
        demographics: demographics ?? null,
        market_context: marketContext,
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone demographics GET error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

/**
 * POST /api/admin/sales-engine/zones/[id]/demographics
 * Trigger demographic enrichment for a specific zone.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await enrichZoneDemographics(id);

    if (result.error) {
      apiLogger.error('[Sales Engine] Zone demographic enrichment failed', {
        error: result.error,
        zone_id: id,
      });
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    apiLogger.info('[Sales Engine] Zone demographics enriched', {
      zone_id: id,
      data: result.data,
    });

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone demographics POST error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
