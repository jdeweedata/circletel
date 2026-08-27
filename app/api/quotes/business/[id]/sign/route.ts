import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSignQuoteRequest, canSignQuote } from '@/lib/quotes/quote-validator';
import type { SignQuoteRequest } from '@/lib/quotes/types';
import { apiLogger } from '@/lib/logging';
import {
  quoteKindFromQuote,
  resolveCompanyCreditPulls,
} from '@/lib/credit-risk/business-gate';
import { toCustomerCreditFields } from '@/lib/credit-risk/customer-outcome';
import { upsertQuoteCreditReview } from '@/lib/credit-risk/review-store';
import { riskServiceKeyConfigured } from '@/lib/credit-risk/netcash-risk-client';
import { runSignedQuoteCompanyPull } from '@/lib/credit-risk/quote-company-pull';

/**
 * POST /api/quotes/business/:id/sign
 *
 * Customer signs a quote (digital signature)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body: SignQuoteRequest = await request.json();

    // Validate signature request
    const validation = validateSignQuoteRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(', ')
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch current quote
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

    // Check if quote can be signed
    if (!canSignQuote(quote as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote cannot be signed in current status or has expired'
        },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ip_address = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       'unknown';

    // Create signature record
    const { data: signature, error: signatureError } = await supabase
      .from('business_quote_signatures')
      .insert({
        quote_id: id,
        signer_name: body.signer_name,
        signer_email: body.signer_email,
        signer_id_number: body.signer_id_number,
        signer_title: body.signer_title || null,
        signature_data: body.signature_data,
        ip_address,
        user_agent: request.headers.get('user-agent') || 'unknown',
        terms_accepted: body.terms_accepted,
        fica_documents_confirmed: body.fica_documents_confirmed,
        cipc_documents_confirmed: body.cipc_documents_confirmed,
        additional_notes: body.additional_notes || null
      })
      .select()
      .single();

    if (signatureError || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save signature'
        },
        { status: 500 }
      );
    }

    // Update quote status to accepted
    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        status: 'accepted',
        signed_at: signature.signed_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      // Rollback signature
      await supabase
        .from('business_quote_signatures')
        .delete()
        .eq('id', signature.id);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update quote status'
        },
        { status: 500 }
      );
    }

    const { data: quoteItems } = await supabase
      .from('business_quote_items')
      .select('product_category, service_type, service_name')
      .eq('quote_id', id);

    const quoteKind = quoteKindFromQuote({
      customerType: updatedQuote.customer_type,
      contractTerm: updatedQuote.contract_term,
      items: quoteItems,
    });
    const pulls = resolveCompanyCreditPulls({
      signedAt: signature.signed_at,
      termsAccepted: Boolean(body.terms_accepted),
      registrationNumber: updatedQuote.registration_number,
      quoteKind,
      directorDocsReady: Boolean(body.fica_documents_confirmed && body.cipc_documents_confirmed),
      directorIsPayer: Boolean((body as { director_is_payer?: boolean }).director_is_payer),
    });

    let creditReview = null;
    if (pulls.includes('CD32')) {
      creditReview = await upsertQuoteCreditReview(supabase, {
        business_quote_id: id,
        purpose: pulls.join(','),
        bureau: 'CIPC',
        requested_at: new Date().toISOString(),
        decision: 'UNCHECKED',
      });

      if (riskServiceKeyConfigured() && updatedQuote.registration_number) {
        // Sign stays unblocked. Persist the company result when the poll lands.
        runSignedQuoteCompanyPull({
          supabase,
          quoteId: id,
          registrationNumber: String(updatedQuote.registration_number),
          accountReference: updatedQuote.quote_number || id,
          purpose: pulls.join(','),
        }).catch((pullError) => {
          apiLogger.error('CD32 pull failed after quote sign', {
            quoteId: id,
            error: pullError instanceof Error ? pullError.message : String(pullError),
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      quote: {
        ...updatedQuote,
        ...toCustomerCreditFields(creditReview),
      },
      signature,
      message: 'Quote signed successfully'
    });
  } catch (error) {
    apiLogger.error('Error signing quote', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sign quote'
      },
      { status: 500 }
    );
  }
}
