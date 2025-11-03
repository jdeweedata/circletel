import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/compliance/decline
 * Decline KYC session with reason and notify customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reason } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Decline reason is required' },
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

    // Get KYC session with quote details
    const { data: session, error: sessionError } = await supabase
      .from('kyc_sessions')
      .select(`
        *,
        business_quotes (
          id,
          quote_number,
          customer_name,
          customer_email
        )
      `)
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

    // Update KYC session to declined
    const { error: updateError } = await supabase
      .from('kyc_sessions')
      .update({
        verification_result: 'declined',
        status: 'declined',
        completed_at: new Date().toISOString(),
        extracted_data: {
          ...session.extracted_data,
          decline_reason: reason,
          declined_by: adminUser.id,
          declined_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating KYC session:', updateError);
      return NextResponse.json(
        { error: 'Failed to decline KYC session' },
        { status: 500 }
      );
    }

    // Update business quote status
    const { error: quoteError } = await supabase
      .from('business_quotes')
      .update({
        status: 'kyc_declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.quote_id);

    if (quoteError) {
      console.error('Error updating quote status:', quoteError);
      // Don't fail the request, KYC is already declined
    }

    // TODO: Send customer email notification (will be implemented in Task Group 14)
    // This will notify the customer about the KYC decline and next steps
    console.log('TODO: Send email to customer:', {
      email: (session as any).business_quotes?.customer_email,
      reason,
      quoteNumber: (session as any).business_quotes?.quote_number
    });

    return NextResponse.json({
      success: true,
      message: 'KYC session declined successfully',
      sessionId,
      reason
    });

  } catch (error) {
    console.error('Error in decline endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
