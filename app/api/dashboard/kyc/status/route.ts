import { NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { getConsumerKYCSession } from '@/lib/integrations/didit/session-manager';

export async function GET() {
  try {
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
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
          risk_score: session.risk_score,
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
