/**
 * Admin API: Coverage Demand Analysis
 * GET - Aggregate coverage check demand by area, cross-referenced with infrastructure
 *
 * Returns demand hotspots: areas where users searched for coverage but service
 * may not be available, helping identify expansion opportunities.
 *
 * Query Parameters:
 * - days: Look back period in days (default: 30, max: 365)
 * - minSearches: Minimum searches to qualify as hotspot (default: 3)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
    const minSearches = parseInt(searchParams.get('minSearches') || '3');

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get coverage leads for the period
    const { data: coverageLeads, error: leadsError } = await supabase
      .from('coverage_leads')
      .select('id, address, latitude, longitude, coverage_available, created_at')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (leadsError) {
      apiLogger.error('[Coverage Demand API] Coverage leads query error', {
        error: leadsError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch coverage leads' },
        { status: 500 }
      );
    }

    // Get no-coverage leads for the period
    const { data: noCoverageLeads, error: ncError } = await supabase
      .from('no_coverage_leads')
      .select('id, address, latitude, longitude, service_type, status, created_at')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (ncError) {
      apiLogger.error('[Coverage Demand API] No coverage leads query error', {
        error: ncError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch no-coverage leads' },
        { status: 500 }
      );
    }

    // Get infrastructure counts for context
    const [dfaCount, taranaCount] = await Promise.all([
      supabase
        .from('dfa_buildings')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('tarana_base_stations')
        .select('id', { count: 'exact', head: true }),
    ]);

    // Aggregate by approximate area (round lat/lng to ~1km grid)
    const areaMap = new Map<
      string,
      {
        lat: number;
        lng: number;
        addresses: string[];
        totalSearches: number;
        withCoverage: number;
        withoutCoverage: number;
        noCoverageLeads: number;
        serviceTypes: Record<string, number>;
      }
    >();

    // Process coverage leads
    const allLeads = coverageLeads || [];
    for (const lead of allLeads) {
      if (lead.latitude == null || lead.longitude == null) continue;

      // Round to ~1km grid (0.01 degree ≈ 1.1km)
      const gridLat = Math.round(lead.latitude * 100) / 100;
      const gridLng = Math.round(lead.longitude * 100) / 100;
      const key = `${gridLat},${gridLng}`;

      const existing = areaMap.get(key) || {
        lat: gridLat,
        lng: gridLng,
        addresses: [],
        totalSearches: 0,
        withCoverage: 0,
        withoutCoverage: 0,
        noCoverageLeads: 0,
        serviceTypes: {},
      };

      existing.totalSearches++;
      if (lead.coverage_available) {
        existing.withCoverage++;
      } else {
        existing.withoutCoverage++;
      }
      if (lead.address && existing.addresses.length < 5) {
        existing.addresses.push(lead.address);
      }

      areaMap.set(key, existing);
    }

    // Process no-coverage leads
    const ncLeads = noCoverageLeads || [];
    for (const lead of ncLeads) {
      if (lead.latitude == null || lead.longitude == null) continue;

      const gridLat = Math.round(lead.latitude * 100) / 100;
      const gridLng = Math.round(lead.longitude * 100) / 100;
      const key = `${gridLat},${gridLng}`;

      const existing = areaMap.get(key) || {
        lat: gridLat,
        lng: gridLng,
        addresses: [],
        totalSearches: 0,
        withCoverage: 0,
        withoutCoverage: 0,
        noCoverageLeads: 0,
        serviceTypes: {},
      };

      existing.noCoverageLeads++;
      if (lead.service_type) {
        existing.serviceTypes[lead.service_type] =
          (existing.serviceTypes[lead.service_type] || 0) + 1;
      }
      if (lead.address && existing.addresses.length < 5) {
        existing.addresses.push(lead.address);
      }

      areaMap.set(key, existing);
    }

    // Filter to hotspots (areas with minimum searches)
    const hotspots = Array.from(areaMap.values())
      .filter(
        (area) =>
          area.totalSearches + area.noCoverageLeads >= minSearches
      )
      .sort(
        (a, b) =>
          b.totalSearches +
          b.noCoverageLeads -
          (a.totalSearches + a.noCoverageLeads)
      )
      .map((area) => ({
        latitude: area.lat,
        longitude: area.lng,
        sampleAddresses: area.addresses,
        totalSearches: area.totalSearches,
        withCoverage: area.withCoverage,
        withoutCoverage: area.withoutCoverage,
        noCoverageLeads: area.noCoverageLeads,
        demandScore: area.totalSearches + area.noCoverageLeads * 2,
        gapScore: area.withoutCoverage + area.noCoverageLeads,
        serviceInterest: area.serviceTypes,
      }));

    // Summary metrics
    const totalSearches = allLeads.length;
    const totalNoCoverage = ncLeads.length;
    const coverageRate =
      totalSearches > 0
        ? Math.round(
            (allLeads.filter((l) => l.coverage_available).length /
              totalSearches) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days,
          from: fromDate.toISOString(),
          to: new Date().toISOString(),
        },
        summary: {
          totalCoverageSearches: totalSearches,
          totalNoCoverageLeads: totalNoCoverage,
          coverageRate,
          hotspotsFound: hotspots.length,
          infrastructure: {
            dfaBuildings: dfaCount.count || 0,
            taranaBaseStations: taranaCount.count || 0,
          },
        },
        hotspots,
      },
    });
  } catch (error) {
    apiLogger.error('[Coverage Demand API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze coverage demand',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
