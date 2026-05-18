import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { createKYCSessionForConsumer } from '@/lib/integrations/didit/session-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const origin = request.headers.get('origin') || 'https://www.circletel.co.za';
    const callbackUrl = `${origin}/dashboard/kyc?status=completed`;

    const result = await createKYCSessionForConsumer(user.id, callbackUrl);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        verificationUrl: result.verificationUrl,
      },
    });
  } catch (error) {
    console.error('[KYC] Session creation failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create KYC session' },
      { status: 500 }
    );
  }
}
