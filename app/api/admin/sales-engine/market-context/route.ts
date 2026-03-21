import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  getProvinceMarketContext,
  getAllProvinceMarketContexts,
  getNationalMarketContext,
} from '@/lib/sales-engine/market-indicators-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/market-context
 * Returns provincial and national market indicators.
 *
 * Query params:
 * - province: filter to single province (optional — returns all if omitted)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');

    if (province) {
      const result = await getProvinceMarketContext(province);
      if (result.error) {
        return NextResponse.json({ error: result.error, success: false }, { status: 500 });
      }
      return NextResponse.json({
        data: { provinces: result.data ? [result.data] : [], national: null },
        success: true,
      });
    }

    // Fetch all provinces + national in parallel
    const [provincesResult, nationalResult] = await Promise.all([
      getAllProvinceMarketContexts(),
      getNationalMarketContext(),
    ]);

    if (provincesResult.error) {
      return NextResponse.json({ error: provincesResult.error, success: false }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        provinces: provincesResult.data ?? [],
        national: nationalResult.data ?? null,
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Market Context] GET error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
