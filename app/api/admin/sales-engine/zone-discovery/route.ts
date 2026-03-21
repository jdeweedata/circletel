import { NextRequest, NextResponse } from 'next/server';
import {
  runZoneDiscovery,
  getDiscoveryCandidates,
} from '@/lib/sales-engine/zone-discovery-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/admin/sales-engine/zone-discovery
 * List discovery candidates with optional filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | 'expired' | null;
    const province = searchParams.get('province');
    const minScore = searchParams.get('min_score');
    const batchId = searchParams.get('batch_id');
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');

    const result = await getDiscoveryCandidates({
      status: status ?? undefined,
      province: province ?? undefined,
      min_score: minScore ? Number(minScore) : undefined,
      batch_id: batchId ?? undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-engine/zone-discovery
 * Trigger a new discovery run.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { province, min_fit_score, limit } = body as {
      province?: string;
      min_fit_score?: number;
      limit?: number;
    };

    const result = await runZoneDiscovery({
      province,
      min_fit_score,
      limit,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
