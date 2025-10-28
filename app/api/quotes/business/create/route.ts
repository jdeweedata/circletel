import { NextRequest, NextResponse } from 'next/server';
import { createBusinessQuote, QuoteGenerationError } from '@/lib/quotes/quote-generator';
import type { CreateQuoteRequest } from '@/lib/quotes/types';

/**
 * POST /api/quotes/business/create
 *
 * Create a new business quote
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateQuoteRequest = await request.json();

    // TODO: Get admin user ID from session when implementing auth
    const created_by = undefined;

    const quote = await createBusinessQuote(body, created_by);

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

    console.error('Error creating quote:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quote'
      },
      { status: 500 }
    );
  }
}
