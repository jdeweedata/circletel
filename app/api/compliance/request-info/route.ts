import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/compliance/request-info
 * Request additional documents/information from customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, note } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'Information request note is required' },
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
      .select('id, role, email')
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

    // Create info request record
    const infoRequest = {
      requested_by: adminUser.id,
      requested_by_email: adminUser.email,
      requested_at: new Date().toISOString(),
      note: note.trim()
    };

    // Update KYC session with info request
    const { error: updateError } = await supabase
      .from('kyc_sessions')
      .update({
        extracted_data: {
          ...session.extracted_data,
          info_requests: [
            ...(session.extracted_data?.info_requests || []),
            infoRequest
          ]
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      apiLogger.error('Error updating KYC session:', updateError);
      return NextResponse.json(
        { error: 'Failed to add information request' },
        { status: 500 }
      );
    }

    // Update business quote status to indicate info requested
    const { error: quoteError } = await supabase
      .from('business_quotes')
      .update({
        status: 'kyc_info_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.quote_id);

    if (quoteError) {
      apiLogger.error('Error updating quote status:', quoteError);
      // Don't fail the request, info request is already saved
    }

    // TODO: Send customer email notification (will be implemented in Task Group 14)
    // This will notify the customer about the additional information needed
    apiLogger.info('TODO: Send email to customer:', {
      email: (session as any).business_quotes?.customer_email,
      note,
      quoteNumber: (session as any).business_quotes?.quote_number,
      adminEmail: adminUser.email
    });

    return NextResponse.json({
      success: true,
      message: 'Information request sent successfully',
      sessionId,
      infoRequest
    });

  } catch (error) {
    apiLogger.error('Error in request-info endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
