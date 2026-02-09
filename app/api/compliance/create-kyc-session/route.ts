/**
 * POST /api/compliance/create-kyc-session
 *
 * Creates a new Didit KYC verification session for a business quote
 * Determines flow type based on quote amount and customer type
 *
 * Request Body:
 * {
 *   quoteId: string // CircleTel business quote ID
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: {
 *     sessionId: string,
 *     verificationUrl: string,
 *     flowType: 'sme_light' | 'consumer_light' | 'full_kyc',
 *     expiresAt: string
 *   },
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createKYCSessionForQuote } from '@/lib/integrations/didit/session-manager';
import { apiLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { quoteId } = body;

    // 2. Validate input
    if (!quoteId || typeof quoteId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid quoteId in request body',
        },
        { status: 400 }
      );
    }

    apiLogger.info(`[API] Creating KYC session for quote: ${quoteId}`);

    // 3. Create KYC session using session manager
    let sessionResult;
    try {
      sessionResult = await createKYCSessionForQuote(quoteId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Check if error is due to quote not found (404) or other error (500)
      if (errorMessage.includes('Quote not found')) {
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 404 }
        );
      }

      // Other errors (Didit API failures, database errors)
      apiLogger.error('[API] KYC session creation failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create KYC session',
        },
        { status: 500 }
      );
    }

    // 4. Return success response
    apiLogger.info(
      `[API] KYC session created successfully: ${sessionResult.sessionId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionResult.sessionId,
        verificationUrl: sessionResult.verificationUrl,
        flowType: sessionResult.flowType,
        expiresAt: sessionResult.expiresAt,
      },
    });
  } catch (error) {
    apiLogger.error('[API] Unexpected error in create-kyc-session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
