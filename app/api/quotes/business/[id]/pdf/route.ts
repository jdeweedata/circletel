/**
 * API Route: Generate Quote PDF
 * 
 * GET /api/quotes/business/[id]/pdf
 * 
 * Generates and returns a PDF document for a business quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuotePDFBlob } from '@/lib/quotes/pdf-generator';
import type { QuoteDetails } from '@/lib/quotes/types';
import { apiLogger } from '@/lib/logging';
import { fetchQuoteTerms } from '@/lib/quotes/quote-terms';
import { buildQuoteBenefits } from '@/lib/quotes/quote-benefits';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch quote with items
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

    // Fetch quote items
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

    // Combine quote with items
    const quoteDetails: QuoteDetails = {
      ...quote,
      items: items || []
    };

    // Fetch terms and build benefits for the PDF
    const serviceTypes = [...new Set((items || []).map((item: any) => item.service_type))];
    const terms = await fetchQuoteTerms(serviceTypes, quote.contract_term);
    const benefits = buildQuoteBenefits(quoteDetails.items);

    // Generate PDF blob
    const pdfBlob = generateQuotePDFBlob(quoteDetails, {
      includeTerms: true,
      includeSignature: true,
      terms,
      benefits
    });

    // Convert blob to buffer for NextResponse
    const buffer = await pdfBlob.arrayBuffer();

    // Return PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CircleTel-Quote-${quote.quote_number}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    apiLogger.error('PDF generation error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
