import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateStatusTransition } from '@/lib/quotes/quote-validator';

/**
 * POST /api/quotes/business/:id/approve
 *
 * Approve a quote (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const validation = validateStatusTransition(quote.status as any, 'approved');
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
        status: 'approved',
        approved_by: admin_id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to approve quote'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote approved successfully'
    });
  } catch (error) {
    console.error('Error approving quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve quote'
      },
      { status: 500 }
    );
  }
}
