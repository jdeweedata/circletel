import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/compliance/approve
 * Approve pending KYC session and trigger contract generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get KYC session
    const { data: session, error: sessionError } = await supabase
      .from('kyc_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'KYC session not found' },
        { status: 404 }
      );
    }

    // Verify session is pending review
    if (session.verification_result !== 'pending_review') {
      return NextResponse.json(
        { error: 'KYC session is not pending review' },
        { status: 400 }
      );
    }

    // Update KYC session to approved
    const { error: updateError } = await supabase
      .from('kyc_sessions')
      .update({
        verification_result: 'approved',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      apiLogger.error('Error updating KYC session:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve KYC session' },
        { status: 500 }
      );
    }

    // Update business quote status to trigger contract generation
    // Contract generation is handled by trigger in database
    const { error: quoteError } = await supabase
      .from('business_quotes')
      .update({
        status: 'kyc_approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.quote_id);

    if (quoteError) {
      apiLogger.error('Error updating quote status:', quoteError);
      // Don't fail the request, KYC is already approved
    }

    // TODO: Trigger contract generation (will be implemented in Task Group 6)
    // This will be handled by a separate service or database trigger

    return NextResponse.json({
      success: true,
      message: 'KYC session approved successfully',
      sessionId
    });

  } catch (error) {
    apiLogger.error('Error in approve endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
