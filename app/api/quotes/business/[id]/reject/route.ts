import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateStatusTransition } from '@/lib/quotes/quote-validator';

/**
 * POST /api/quotes/business/:id/reject
 *
 * Reject a quote (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { rejection_reason } = body;

    const supabase = await createClient();

    // TODO: Get admin user from session and verify permissions
    const admin_id = undefined;

    // Fetch current quote
    const { data: quote, error: fetchError } = await supabase
      .from('business_quotes')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found'
        },
        { status: 404 }
      );
    }

    // Validate status transition
    const validation = validateStatusTransition(quote.status as any, 'rejected');
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(', ')
        },
        { status: 400 }
      );
    }

    // Update quote status
    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        status: 'rejected',
        customer_notes: rejection_reason ? `REJECTED: ${rejection_reason}` : 'Quote rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      console.error('Quote rejection error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || 'Failed to reject quote'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject quote'
      },
      { status: 500 }
    );
  }
}
