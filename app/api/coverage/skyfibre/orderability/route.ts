import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkSkyFibreOrderability,
  isValidSkyFibreCapacity,
  redactSkyFibreOrderability,
} from '@/lib/coverage/skyfibre/orderability';
import type {
  SkyFibreOrderabilityResult,
  SkyFibreSegment,
} from '@/lib/coverage/skyfibre/types';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const leadId = typeof body.leadId === 'string' ? body.leadId : undefined;
    const latitude = typeof body.latitude === 'number' ? body.latitude : undefined;
    const longitude = typeof body.longitude === 'number' ? body.longitude : undefined;
    const capacityMbps = body.capacityMbps;
    const segment = normalizeSegment(body.segment);

    if (!isValidSkyFibreCapacity(capacityMbps)) {
      return NextResponse.json(
        { success: false, error: 'capacityMbps must be one of 50, 100, or 200' },
        { status: 400 }
      );
    }

    if (!leadId && (latitude === undefined || longitude === undefined)) {
      return NextResponse.json(
        { success: false, error: 'Either leadId or coordinates are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const result = await checkSkyFibreOrderability(
      {
        leadId,
        latitude,
        longitude,
        capacityMbps,
        ...(segment ? { segment } : {}),
      },
      { supabase }
    );

    const redacted = redactSkyFibreOrderability(result);

    if (leadId) {
      await appendCoverageResult(supabase, leadId, redacted);
    }

    apiLogger.info('[SkyFibreOrderability] Check complete', {
      leadId: leadId || null,
      segment: redacted.segment,
      capacityMbps: redacted.capacityMbps,
      decision: redacted.decision,
      cspStatus: redacted.cspOrderability?.status || null,
      tcsConfidence: redacted.tcsCoverage.confidence,
    });

    return NextResponse.json({
      success: true,
      data: redacted,
    });
  } catch (error) {
    apiLogger.error('[SkyFibreOrderability] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : 'SkyFibre orderability check failed';
    const status = /lead not found/i.test(message) ? 404 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

async function appendCoverageResult(
  supabase: any,
  leadId: string,
  result: SkyFibreOrderabilityResult
): Promise<void> {
  const { data, error } = await supabase
    .from('coverage_leads')
    .select('coverage_results')
    .eq('id', leadId)
    .single();

  if (error) {
    apiLogger.error('[SkyFibreOrderability] Failed to load coverage_results', {
      leadId,
      error: error.message,
    });
    return;
  }

  const existingResults = Array.isArray(data?.coverage_results)
    ? data.coverage_results
    : [];

  const entry = {
    technology: 'SkyFibre',
    provider: 'mtn-csp',
    is_feasible: result.decision === 'orderable',
    confidence: result.tcsCoverage.confidence,
    checked_at: new Date().toISOString(),
    decision: result.decision,
    segment: result.segment,
    capacity_mbps: result.capacityMbps,
    tcs: result.tcsCoverage,
    csp: result.cspOrderability
      ? {
          provider: result.cspOrderability.provider,
          method: result.cspOrderability.method,
          status: result.cspOrderability.status,
          orderable: result.cspOrderability.orderable,
          taranaZone: result.cspOrderability.taranaZone ?? null,
          checkedAt: result.cspOrderability.checkedAt,
        }
      : null,
  };

  const { error: updateError } = await supabase
    .from('coverage_leads')
    .update({ coverage_results: [...existingResults, entry] })
    .eq('id', leadId);

  if (updateError) {
    apiLogger.error('[SkyFibreOrderability] Failed to persist coverage_results', {
      leadId,
      error: updateError.message,
    });
  }
}

function normalizeSegment(value: unknown): SkyFibreSegment | undefined {
  return value === 'business' || value === 'residential' ? value : undefined;
}
