/**
 * Pay Now Redirect API
 *
 * Short URL handler for Pay Now payment links.
 * Looks up paynow_transaction_ref in customer_invoices and redirects to full payment URL.
 *
 * URL: circletel.co.za/api/paynow/[ref]
 *
 * This allows SMS messages to use short URLs instead of full NetCash URLs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;

  if (!ref) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Look up invoice by transaction reference
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select('paynow_url, status')
      .eq('paynow_transaction_ref', ref)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Payment reference not found' },
        { status: 404 }
      );
    }

    if (!invoice.paynow_url) {
      return NextResponse.json(
        { error: 'Payment URL not available' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return NextResponse.redirect(
        new URL('/dashboard/billing?already_paid=true', request.url)
      );
    }

    // Redirect to full NetCash payment URL
    return NextResponse.redirect(invoice.paynow_url);
  } catch (err) {
    console.error('[PayNow Redirect] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
