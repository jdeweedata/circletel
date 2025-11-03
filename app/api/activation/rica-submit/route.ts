/**
 * API Route: RICA Submission
 *
 * POST /api/activation/rica-submit
 *
 * Purpose: Submit RICA registration using KYC data
 * Task Group: 12.6 - RICA Submit API
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitRICAWithDiditData } from '@/lib/compliance/rica-paired-submission';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/activation/rica-submit
 *
 * Request Body:
 * {
 *   kycSessionId: string;
 *   orderId: string;
 *   serviceLines: string[]; // ICCID/SIM card numbers
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   ricaSubmissionId?: string;
 *   icasaTrackingId?: string;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RICA Submit API] Received submission request');

    // Parse request body
    const body = await request.json();
    const { kycSessionId, orderId, serviceLines } = body;

    // Validate required fields
    if (!kycSessionId || !orderId || !serviceLines || serviceLines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: kycSessionId, orderId, serviceLines'
        },
        { status: 400 }
      );
    }

    console.log('[RICA Submit API] Submitting RICA for order:', orderId);

    // Submit RICA with Didit KYC data
    const result = await submitRICAWithDiditData(kycSessionId, orderId, serviceLines);

    console.log('[RICA Submit API] ✅ Submission successful:', result.icasaTrackingId);

    return NextResponse.json({
      success: true,
      ricaSubmissionId: result.ricaSubmissionId,
      icasaTrackingId: result.icasaTrackingId
    });

  } catch (error) {
    console.error('[RICA Submit API] Submission failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'RICA submission failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/activation/rica-submit?orderId=xxx
 *
 * Check RICA submission status for an order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch RICA submission for order
    const { data: submission, error } = await supabase
      .from('rica_submissions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        { success: false, error: 'RICA submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        icasaTrackingId: submission.icasa_tracking_id,
        submittedAt: submission.submitted_at,
        updatedAt: submission.updated_at
      }
    });

  } catch (error) {
    console.error('[RICA Submit API] Status check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      },
      { status: 500 }
    );
  }
}
