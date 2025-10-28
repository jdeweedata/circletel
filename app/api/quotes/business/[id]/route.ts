import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuoteDetails, BusinessQuote, BusinessQuoteItem } from '@/lib/quotes/types';

/**
 * GET /api/quotes/business/:id
 *
 * Get quote details with items, signature, and versions
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found'
        },
        { status: 404 }
      );
    }

    // Fetch quote items
    const { data: items, error: itemsError } = await supabase
      .from('business_quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch quote items'
        },
        { status: 500 }
      );
    }

    // Fetch signature (if exists)
    const { data: signature } = await supabase
      .from('business_quote_signatures')
      .select('*')
      .eq('quote_id', id)
      .single();

    // Fetch version history
    const { data: versions } = await supabase
      .from('business_quote_versions')
      .select('*')
      .eq('quote_id', id)
      .order('version_number', { ascending: false });

    // Fetch approved_by admin details (if applicable)
    let approved_by_admin = null;
    if (quote.approved_by) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('id, full_name, email')
        .eq('id', quote.approved_by)
        .single();

      approved_by_admin = admin;
    }

    const quoteDetails: QuoteDetails = {
      ...(quote as BusinessQuote),
      items: (items as BusinessQuoteItem[]) || [],
      signature: signature || null,
      versions: versions || [],
      approved_by_admin
    };

    return NextResponse.json({
      success: true,
      quote: quoteDetails
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quote'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quotes/business/:id
 *
 * Update quote details
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // TODO: Get admin user from session
    const updated_by = undefined;

    const { updateBusinessQuote, QuoteGenerationError } = await import('@/lib/quotes/quote-generator');

    const updatedQuote = await updateBusinessQuote(id, body, updated_by);

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote updated successfully'
    });
  } catch (error: any) {
    if (error.code === 'QUOTE_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 404 }
      );
    }

    if (error.code === 'VALIDATION_ERROR' || error.code === 'QUOTE_NOT_EDITABLE') {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      );
    }

    console.error('Error updating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update quote'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotes/business/:id
 *
 * Delete a quote (only if in deletable status)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { deleteBusinessQuote, QuoteGenerationError } = await import('@/lib/quotes/quote-generator');

    await deleteBusinessQuote(id);

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'QUOTE_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 404 }
      );
    }

    if (error.code === 'QUOTE_NOT_DELETABLE') {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      );
    }

    console.error('Error deleting quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete quote'
      },
      { status: 500 }
    );
  }
}
