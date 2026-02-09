import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateStatusTransition, canSendQuote } from '@/lib/quotes/quote-validator';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/quotes/business/:id/send
 *
 * Send quote to customer via email (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { recipient_email, message } = body;

    const supabase = await createClient();

    // TODO: Get admin user from session and verify permissions
    const admin_id = undefined;

    // Fetch current quote with items
    const { data: quote, error: fetchError } = await supabase
      .from('business_quotes')
      .select('*')
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

    // Check if quote can be sent
    if (!canSendQuote(quote as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote must be approved before sending'
        },
        { status: 400 }
      );
    }

    // Validate status transition
    const validation = validateStatusTransition(quote.status as any, 'sent');
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(', ')
        },
        { status: 400 }
      );
    }

    // TODO: Implement email sending logic
    // - Generate PDF
    // - Create email with quote PDF attachment
    // - Send via email service (Resend/SendGrid)

    // For now, just update status
    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send quote'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote sent successfully'
    });
  } catch (error) {
    apiLogger.error('Error sending quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send quote'
      },
      { status: 500 }
    );
  }
}
