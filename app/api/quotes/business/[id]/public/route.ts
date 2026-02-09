/**
 * API Route: Public Quote Access
 *
 * GET /api/quotes/business/[id]/public
 *
 * Fetches quote details for public/shared access (no authentication required)
 * Only works if the quote has sharing enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch quote (only if sharing is enabled)
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .select('*')
      .eq('id', id)
      .eq('share_enabled', true)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found or sharing is disabled' },
        { status: 404 }
      );
    }

    // Check if share link has expired
    if (quote.share_expires_at) {
      const expiresAt = new Date(quote.share_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: 'This share link has expired' },
          { status: 410 }
        );
      }
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
    apiLogger.error('Get public quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
