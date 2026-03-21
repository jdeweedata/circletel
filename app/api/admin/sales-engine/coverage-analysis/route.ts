import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging/logger';
import { getCoverageGapAnalysis } from '@/lib/sales-engine/coverage-enrichment-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/coverage-analysis
 * Returns coverage gap analysis: zones needing investment, untapped opportunities,
 * and overall coverage confidence distribution.
 */
export async function GET() {
  try {
    const result = await getCoverageGapAnalysis();

    if (result.error) {
      apiLogger.error('[Sales Engine] Coverage analysis failed', { error: result.error });
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Coverage analysis error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
