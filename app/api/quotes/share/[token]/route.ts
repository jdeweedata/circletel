/**
 * API Route: Resolve Share Token to Quote
 *
 * GET /api/quotes/share/[token]
 *
 * Resolves a share token to a quote ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const supabase = await createClient();

    // Find quote by share token
    const { data: quote, error } = await supabase
      .from('business_quotes')
      .select('id, quote_number, share_enabled, share_expires_at')
      .eq('share_token', token)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if share is enabled
    if (!quote.share_enabled) {
      return NextResponse.json(
        { success: false, error: 'This share link has been revoked' },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      data: {
        quote_id: quote.id,
        quote_number: quote.quote_number
      }
    });

  } catch (error: any) {
    apiLogger.error('Share token resolution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve share link',
        details: error.message
      },
      { status: 500 }
    );
  }
}
