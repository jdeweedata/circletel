/**
 * Unified Products API
 * GET /api/admin/products/unified
 *
 * Read-only aggregation of all product sources (CircleTel services,
 * MTN/Arlan deals, hardware) into one list for the admin unified console.
 *
 * Query params:
 *   source     CircleTel | MTN / Arlan | Hardware   (omit for all)
 *   status     active | draft | pending | archived | inactive
 *   search     free-text across name / sku / description
 *   sort_by    updated_desc (default) | created_desc | name_asc | price_desc | price_asc
 *   page       default 1
 *   per_page   default 20, max 100
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';
import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import type {
  UnifiedProductFilters,
  UnifiedProductSource,
  UnifiedProductStatus,
} from '@/lib/types/unified-product';

export const runtime = 'nodejs';
export const maxDuration = 15;

const VALID_SOURCES: UnifiedProductSource[] = ['CircleTel', 'MTN / Arlan', 'Hardware'];
const VALID_STATUSES: UnifiedProductStatus[] = ['active', 'draft', 'pending', 'archived', 'inactive'];
const VALID_SORTS: NonNullable<UnifiedProductFilters['sortBy']>[] = [
  'updated_desc',
  'created_desc',
  'name_asc',
  'price_desc',
  'price_asc',
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);

    const sourceParam = searchParams.get('source');
    const statusParam = searchParams.get('status');
    const sortParam = searchParams.get('sort_by');

    const filters: UnifiedProductFilters = {
      source: sourceParam && VALID_SOURCES.includes(sourceParam as UnifiedProductSource)
        ? (sourceParam as UnifiedProductSource)
        : undefined,
      status: statusParam && VALID_STATUSES.includes(statusParam as UnifiedProductStatus)
        ? (statusParam as UnifiedProductStatus)
        : undefined,
      search: searchParams.get('search') ?? undefined,
      sortBy: sortParam && VALID_SORTS.includes(sortParam as NonNullable<UnifiedProductFilters['sortBy']>)
        ? (sortParam as NonNullable<UnifiedProductFilters['sortBy']>)
        : undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      perPage: parseInt(searchParams.get('per_page') || '20', 10),
    };

    const result = await unifiedProductAggregator.aggregateAll(filters);

    apiLogger.debug('[Unified Products API] Query completed', {
      durationMs: Date.now() - startTime,
      total: result.total,
      returned: result.products.length,
      source: filters.source ?? 'all',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    apiLogger.error('[Unified Products API] Error', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch unified products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
