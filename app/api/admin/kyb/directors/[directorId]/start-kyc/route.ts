import { NextRequest, NextResponse } from 'next/server';
import { createKYCSessionForKYBSubject } from '@/lib/integrations/didit/session-manager';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ directorId: string }> }
) {
  try {
    const { directorId } = await context.params;

    if (!directorId || typeof directorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid directorId parameter' },
        { status: 400 }
      );
    }

    let sessionResult;
    try {
      sessionResult = await createKYCSessionForKYBSubject(directorId, 'director');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('KYB subject not found')) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 404 }
        );
      }

      if (message.includes('KYB subject type mismatch')) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 }
        );
      }

      if (message.includes('Quote not found')) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 404 }
        );
      }

      apiLogger.error('[API] Director KYB session creation failed', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to create KYB KYC session' },
        { status: 500 }
      );
    }

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
    apiLogger.error('[API] Unexpected error in Director start-kyc', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
