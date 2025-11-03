/**
 * GET /api/compliance/[quoteId]/status
 *
 * Retrieves current KYC verification status for a business quote
 * Returns not_started if no KYC session exists
 *
 * URL Parameters:
 * - quoteId: CircleTel business quote ID
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: {
 *     status: string,
 *     verification_result: string | null,
 *     risk_tier: string | null,
 *     completed_at: string | null,
 *     didit_session_id: string | null
 *   },
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKYCSessionStatus } from '@/lib/integrations/didit/session-manager';

/**
 * CRITICAL: Next.js 15 Async Params Pattern
 *
 * Dynamic route params are now async and must be awaited
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    // 1. Await params (Next.js 15 requirement)
    const { quoteId } = await context.params;

    // 2. Validate quoteId
    if (!quoteId || typeof quoteId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quoteId parameter',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching KYC status for quote: ${quoteId}`);

    // 3. Get KYC session status
    const sessionStatus = await getKYCSessionStatus(quoteId);

    // 4. Handle case where no KYC session exists
    if (!sessionStatus) {
      console.log(`[API] No KYC session found for quote ${quoteId}`);
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_started',
          verification_result: null,
          risk_tier: null,
          completed_at: null,
          didit_session_id: null,
        },
      });
    }

    // 5. Return session status
    console.log(
      `[API] KYC status retrieved: ${sessionStatus.status} (${sessionStatus.verification_result})`
    );

    return NextResponse.json({
      success: true,
      data: {
        status: sessionStatus.status,
        verification_result: sessionStatus.verification_result,
        risk_tier: sessionStatus.risk_tier,
        completed_at: sessionStatus.completed_at,
        didit_session_id: sessionStatus.didit_session_id,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching KYC status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve KYC status',
      },
      { status: 500 }
    );
  }
}
