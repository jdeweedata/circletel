import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getConsumerKYCSession } from '@/lib/integrations/didit/session-manager';

export async function GET(request: NextRequest) {
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

    const session = await getConsumerKYCSession(user.id);

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_started',
          session: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: session.verification_result || session.status,
        session: {
          id: session.id,
          didit_session_id: session.didit_session_id,
          verification_url: session.verification_url,
          status: session.status,
          verification_result: session.verification_result,
          risk_tier: session.risk_tier,
          created_at: session.created_at,
          completed_at: session.completed_at,
        },
      },
    });
  } catch (error) {
    console.error('[KYC] Status fetch failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch KYC status' },
      { status: 500 }
    );
  }
}
