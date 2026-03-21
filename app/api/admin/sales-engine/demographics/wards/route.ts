import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  getWardDemographics,
  getWardImportStats,
  getZoneSuggestions,
} from '@/lib/sales-engine/demographic-enrichment-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/demographics/wards
 * List imported wards with optional filters.
 *
 * Query params:
 * - province: filter by province name
 * - municipality: filter by municipality
 * - minFitScore: minimum demographic fit score (0-100)
 * - page: page number (default 1)
 * - pageSize: items per page (default 50)
 * - mode: 'list' (default) | 'stats' | 'suggestions'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') ?? 'list';

    if (mode === 'stats') {
      const result = await getWardImportStats();
      if (result.error) {
        return NextResponse.json({ error: result.error, success: false }, { status: 500 });
      }
      return NextResponse.json({ data: result.data, success: true });
    }

    if (mode === 'suggestions') {
      const result = await getZoneSuggestions({
        minFitScore: searchParams.get('minFitScore')
          ? Number(searchParams.get('minFitScore'))
          : undefined,
        province: searchParams.get('province') ?? undefined,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error, success: false }, { status: 500 });
      }
      return NextResponse.json({ data: result.data, success: true });
    }

    // Default: list wards
    const result = await getWardDemographics({
      province: searchParams.get('province') ?? undefined,
      municipality: searchParams.get('municipality') ?? undefined,
      minFitScore: searchParams.get('minFitScore')
        ? Number(searchParams.get('minFitScore'))
        : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data?.wards ?? [],
      total: result.data?.total ?? 0,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Demographics] Wards GET error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
