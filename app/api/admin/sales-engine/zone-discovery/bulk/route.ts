import { NextRequest, NextResponse } from 'next/server';
import {
  bulkApprove,
  bulkReject,
} from '@/lib/sales-engine/zone-discovery-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/sales-engine/zone-discovery/bulk
 * Bulk approve or reject discovery candidates.
 * Body: { candidate_ids: string[], action: 'approve' | 'reject', reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_ids, action, reason } = body as {
      candidate_ids: string[];
      action: 'approve' | 'reject';
      reason?: string;
    };

    if (!Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'candidate_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const result = await bulkApprove(candidate_ids);
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (action === 'reject') {
      const result = await bulkReject(candidate_ids, reason);
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "approve" or "reject".' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
