import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createKYCSessionForConsumer } from '@/lib/integrations/didit/session-manager';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      user = tokenUser;
    } else {
      const sessionClient = await createClientWithSession();
      const { data: { user: cookieUser }, error: authError } = await sessionClient.auth.getUser();
      if (authError || !cookieUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      user = cookieUser;
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
