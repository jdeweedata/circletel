import { NextRequest, NextResponse } from 'next/server';
import { createBusinessQuote, QuoteGenerationError } from '@/lib/quotes/quote-generator';
import type { CreateQuoteRequest } from '@/lib/quotes/types';
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { B2BConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/quotes/business/create
 *
 * Create a new business quote
 */
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { consents, ...quoteRequest } = body;

    // TODO: Get admin user ID from session when implementing auth
    const created_by = undefined;

    const quote = await createBusinessQuote(quoteRequest as CreateQuoteRequest, created_by);

    // Log B2B consents if provided
    if (consents && quote.id) {
      const consentLog = await logPaymentConsents({
        quote_id: quote.id,
        customer_email: quoteRequest.contact_email,
        consents: consents as B2BConsents,
        ip_address: extractIpAddress(request),
        user_agent: extractUserAgent(request),
        consent_type: 'quote'
      });

      if (!consentLog.success) {
        apiLogger.error('Failed to log quote consents:', consentLog.error);
        // Don't fail the quote creation if consent logging fails
      } else {
        apiLogger.info('Quote consents logged successfully:', consentLog.consent_id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        quote,
        message: 'Quote created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof QuoteGenerationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code
        },
        { status: 400 }
      );
    }

    apiLogger.error('Error creating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quote'
      },
      { status: 500 }
    );
  }
}
