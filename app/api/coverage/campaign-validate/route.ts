/**
 * Campaign Coverage Validation API
 *
 * POST /api/coverage/campaign-validate
 *
 * Validates whether a customer address is covered by SkyFibre for campaign orders.
 * Combines proximity to Tarana base stations with live status (BN online/offline,
 * RN connectivity) and network-wide device counts to produce a clear verdict.
 *
 * Request: { lat: number, lng: number, address?: string }
 * Response: { verdict: "covered" | "degraded" | "uncovered", reason, confidence, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';
import type { Coordinates } from '@/lib/coverage/types';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { lat, lng, address } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Coordinates (lat, lng) are required as numbers' },
        { status: 400 }
      );
    }

    const coordinates: Coordinates = { lat, lng };

    // 1. Check base station proximity (includes live-status gating)
    const proximity = await checkBaseStationProximity(coordinates, { limit: 3 });

    // 2. Get latest network-wide device counts for context
    const supabase = await createClient();
    const { data: deviceCounts } = await supabase
      .from('tarana_device_counts')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Determine coverage verdict
    let verdict: 'covered' | 'degraded' | 'uncovered' = 'uncovered';
    let reason = '';

    if (!proximity.hasCoverage) {
      verdict = 'uncovered';
      reason = proximity.installationNote || 'No base station within coverage range.';
    } else if (proximity.confidence === 'high') {
      verdict = 'covered';
      const ns = proximity.nearestStation;
      reason = ns
        ? `Strong coverage: ${ns.siteName} (${ns.distanceKm}km, ${ns.activeConnections} connections)`
        : 'Strong coverage confirmed.';
    } else if (proximity.confidence === 'medium') {
      verdict = 'degraded';
      reason = proximity.installationNote || 'Moderate coverage — installation may need verification.';
    } else if (proximity.confidence === 'low') {
      verdict = 'degraded';
      reason = proximity.installationNote || 'Weak coverage — elevated install likely required.';
    }

    const response = {
      success: true,
      data: {
        verdict,
        reason,
        confidence: proximity.confidence,
        nearestStation: proximity.nearestStation,
        requiresElevatedInstall: proximity.requiresElevatedInstall,
        networkSummary: deviceCounts
          ? {
              totalBNs: deviceCounts.bn_total,
              onlineBNs: deviceCounts.bn_connected,
              totalRNs: deviceCounts.rn_total,
              onlineRNs: deviceCounts.rn_connected,
              fetchedAt: deviceCounts.fetched_at,
            }
          : null,
        address: address || null,
      },
    };

    apiLogger.info('[CampaignValidate] Coverage check complete', {
      verdict,
      confidence: proximity.confidence,
      nearestStation: proximity.nearestStation?.siteName || 'none',
    });

    return NextResponse.json(response);
  } catch (error) {
    apiLogger.error('[CampaignValidate] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Coverage validation failed',
      },
      { status: 500 }
    );
  }
}
