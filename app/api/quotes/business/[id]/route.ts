/**
 * API Routes: Quote Operations
 * 
 * GET /api/quotes/business/[id] - Get quote details
 * PUT /api/quotes/business/[id] - Update quote
 * DELETE /api/quotes/business/[id] - Delete quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePricingBreakdown } from '@/lib/quotes/quote-calculator';

/**
 * GET - Fetch quote with items
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
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('business_quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quote items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        items: items || []
      }
    });
  } catch (error: any) {
    console.error('Get quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update quote
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const supabase = await createClient();

    // Check if quote exists and can be edited
    const { data: existingQuote, error: fetchError } = await supabase
      .from('business_quotes')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if quote can be edited
    const editableStatuses = ['draft', 'pending_approval', 'approved', 'sent', 'viewed'];
    if (!editableStatuses.includes(existingQuote.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Quote cannot be edited in ${existingQuote.status} status`
        },
        { status: 400 }
      );
    }

    // Update quote details
    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        company_name: body.company_name,
        registration_number: body.registration_number,
        vat_number: body.vat_number,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        service_address: body.service_address,
        contract_term: body.contract_term,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update quote error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        const { error: itemError } = await supabase
          .from('business_quote_items')
          .update({
            quantity: item.quantity,
            monthly_price: item.monthly_price,
            installation_price: item.installation_price,
            notes: item.notes,
            display_order: item.display_order
          })
          .eq('id', item.id);

        if (itemError) {
          console.error('Update item error:', itemError);
        }
      }
    }

    // Recalculate pricing
    const { data: items } = await supabase
      .from('business_quote_items')
      .select('*')
      .eq('quote_id', id);

    if (items) {
      const pricing = calculatePricingBreakdown(
        items as any[],
        body.contract_term || updatedQuote.contract_term
      );

      await supabase
        .from('business_quotes')
        .update({
          subtotal_monthly: pricing.subtotal_monthly,
          subtotal_installation: pricing.subtotal_installation,
          vat_amount_monthly: pricing.vat_monthly,
          vat_amount_installation: pricing.vat_installation,
          total_monthly: pricing.total_monthly,
          total_installation: pricing.total_installation
        })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote: updatedQuote
    });
  } catch (error: any) {
    console.error('Update quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete quote
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check if quote can be deleted
    const { data: quote, error: fetchError } = await supabase
      .from('business_quotes')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft, rejected, or expired quotes
    const deletableStatuses = ['draft', 'rejected', 'expired'];
    if (!deletableStatuses.includes(quote.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Quote cannot be deleted in ${quote.status} status` 
        },
        { status: 400 }
      );
    }

    // Delete quote (cascade will delete items)
    const { error: deleteError } = await supabase
      .from('business_quotes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
