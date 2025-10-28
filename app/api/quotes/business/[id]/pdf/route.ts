import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuotePDFBlob } from '@/lib/quotes/pdf-generator-v2';
import type { QuoteDetails } from '@/lib/quotes/types';

/**
 * GET /api/quotes/business/:id/pdf
 *
 * Generate and download quote as PDF
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch quote with all details
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

    // Fetch signature if exists
    const { data: signature } = await supabase
      .from('business_quote_signatures')
      .select('*')
      .eq('quote_id', id)
      .single();

    // Fetch versions
    const { data: versions } = await supabase
      .from('business_quote_versions')
      .select('*')
      .eq('quote_id', id)
      .order('version_number', { ascending: false });

    // Fetch approved_by admin details
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
      ...quote,
      items: items || [],
      signature: signature || null,
      versions: versions || [],
      approved_by_admin
    };

    // Generate PDF
    const pdfBlob = generateQuotePDFBlob(quoteDetails, {
      includeTerms: true,
      includeSignature: !!signature
    });

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CircleTel-Quote-${quote.quote_number}.pdf"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF'
      },
      { status: 500 }
    );
  }
}
