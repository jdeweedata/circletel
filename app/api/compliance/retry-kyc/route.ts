/**
 * POST /api/compliance/retry-kyc
 *
 * Creates a new KYC verification session for quotes with declined or abandoned sessions
 * Allows customers to retry verification with updated documents
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
import { retryKYCSession } from '@/lib/integrations/didit/session-manager';
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

    apiLogger.info(`[API] Retrying KYC session for quote: ${quoteId}`);

    // 3. Retry KYC session using session manager
    let sessionResult;
    try {
      sessionResult = await retryKYCSession(quoteId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Check if error is due to quote not found (404) or invalid state (400)
      if (errorMessage.includes('Quote not found')) {
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes('Cannot retry KYC session')) {
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 400 }
        );
      }

      // Other errors (Didit API failures, database errors)
      apiLogger.error('[API] KYC retry failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retry KYC session',
        },
        { status: 500 }
      );
    }

    // 4. Return success response
    apiLogger.info(
      `[API] KYC session retry successful: ${sessionResult.sessionId}`
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
    apiLogger.error('[API] Unexpected error in retry-kyc:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
