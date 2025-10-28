/**
 * Quote Generator
 *
 * Main service for creating and managing business quotes
 */

import { createClient } from '@/lib/supabase/server';
import type {
  CreateQuoteRequest,
  BusinessQuote,
  BusinessQuoteItem,
  QuoteWithItems,
  UpdateQuoteRequest
} from './types';
import { validateCreateQuoteRequest, validateUpdateQuoteRequest } from './quote-validator';
import { calculatePricingBreakdown } from './quote-calculator';

export class QuoteGenerationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'QuoteGenerationError';
  }
}

/**
 * Create a new business quote
 */
export async function createBusinessQuote(
  request: CreateQuoteRequest,
  created_by?: string
): Promise<QuoteWithItems> {
  // Validate request
  const validation = validateCreateQuoteRequest(request);
  if (!validation.valid) {
    throw new QuoteGenerationError(
      validation.errors.join(', '),
      'VALIDATION_ERROR'
    );
  }

  const supabase = await createClient();

  try {
    // Step 1: Fetch package details for all items
    const packageIds = request.items.map(item => item.package_id);
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select('*')
      .in('id', packageIds);

    if (packagesError || !packages) {
      throw new QuoteGenerationError(
        'Failed to fetch package details',
        'PACKAGE_FETCH_ERROR'
      );
    }

    // Validate all packages exist
    if (packages.length !== packageIds.length) {
      throw new QuoteGenerationError(
        'One or more packages not found',
        'PACKAGE_NOT_FOUND'
      );
    }

    // Step 2: Create quote record (pricing calculated by trigger)
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .insert({
        customer_id: null, // Set later when customer account created
        lead_id: request.lead_id,
        customer_type: request.customer_type,
        company_name: request.company_name,
        registration_number: request.registration_number || null,
        vat_number: request.vat_number || null,
        contact_name: request.contact_name,
        contact_email: request.contact_email,
        contact_phone: request.contact_phone,
        service_address: request.service_address,
        coordinates: request.coordinates || null,
        status: 'draft',
        contract_term: request.contract_term,
        customer_notes: request.customer_notes || null,
        created_by: created_by || null
      })
      .select()
      .single();

    if (quoteError || !quote) {
      console.error('Quote creation error:', quoteError);
      throw new QuoteGenerationError(
        quoteError?.message || 'Failed to create quote',
        'QUOTE_CREATE_ERROR'
      );
    }

    // Step 3: Create quote items
    const quoteItems = request.items.map((item, index) => {
      const pkg = packages.find(p => p.id === item.package_id);
      if (!pkg) {
        throw new QuoteGenerationError(
          `Package ${item.package_id} not found`,
          'PACKAGE_NOT_FOUND'
        );
      }

      return {
        quote_id: quote.id,
        package_id: item.package_id,
        item_type: item.item_type,
        quantity: item.quantity || 1,
        monthly_price: pkg.price,
        installation_price: pkg.installation_fee || 0,
        custom_pricing: false,
        service_name: pkg.name,
        service_type: pkg.service_type,
        product_category: pkg.product_category,
        speed_down: pkg.speed_down,
        speed_up: pkg.speed_up,
        data_cap_gb: pkg.data_cap_gb,
        notes: item.notes || null,
        display_order: index
      };
    });

    const { data: createdItems, error: itemsError } = await supabase
      .from('business_quote_items')
      .insert(quoteItems)
      .select();

    if (itemsError || !createdItems) {
      // Rollback: delete quote
      await supabase.from('business_quotes').delete().eq('id', quote.id);
      throw new QuoteGenerationError(
        'Failed to create quote items',
        'ITEMS_CREATE_ERROR'
      );
    }

    // Step 4: Recalculate quote totals (trigger should handle this, but force update)
    const pricing = calculatePricingBreakdown(
      createdItems as BusinessQuoteItem[],
      request.contract_term
    );

    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        subtotal_monthly: pricing.subtotal_monthly,
        subtotal_installation: pricing.subtotal_installation,
        vat_amount_monthly: pricing.vat_monthly,
        vat_amount_installation: pricing.vat_installation,
        total_monthly: pricing.total_monthly,
        total_installation: pricing.total_installation
      })
      .eq('id', quote.id)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      throw new QuoteGenerationError(
        'Failed to update quote totals',
        'QUOTE_UPDATE_ERROR'
      );
    }

    // Return complete quote with items
    return {
      ...updatedQuote,
      items: createdItems as BusinessQuoteItem[]
    };
  } catch (error) {
    if (error instanceof QuoteGenerationError) {
      throw error;
    }
    throw new QuoteGenerationError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Update an existing quote
 */
export async function updateBusinessQuote(
  quoteId: string,
  updates: UpdateQuoteRequest,
  updated_by?: string
): Promise<BusinessQuote> {
  // Validate request
  const validation = validateUpdateQuoteRequest(updates);
  if (!validation.valid) {
    throw new QuoteGenerationError(
      validation.errors.join(', '),
      'VALIDATION_ERROR'
    );
  }

  const supabase = await createClient();

  try {
    // Fetch current quote
    const { data: currentQuote, error: fetchError } = await supabase
      .from('business_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError || !currentQuote) {
      throw new QuoteGenerationError('Quote not found', 'QUOTE_NOT_FOUND');
    }

    // Check if quote can be edited
    if (!['draft', 'pending_approval', 'approved'].includes(currentQuote.status)) {
      throw new QuoteGenerationError(
        'Quote cannot be edited in current status',
        'QUOTE_NOT_EDITABLE'
      );
    }

    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('business_quotes')
      .update({
        ...updates,
        updated_by: updated_by || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError || !updatedQuote) {
      throw new QuoteGenerationError(
        'Failed to update quote',
        'QUOTE_UPDATE_ERROR'
      );
    }

    return updatedQuote as BusinessQuote;
  } catch (error) {
    if (error instanceof QuoteGenerationError) {
      throw error;
    }
    throw new QuoteGenerationError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Get quote with items
 */
export async function getQuoteWithItems(
  quoteId: string
): Promise<QuoteWithItems | null> {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from('business_quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('business_quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('display_order', { ascending: true });

  if (itemsError) {
    return null;
  }

  return {
    ...(quote as BusinessQuote),
    items: (items as BusinessQuoteItem[]) || []
  };
}

/**
 * Delete a quote
 */
export async function deleteBusinessQuote(quoteId: string): Promise<boolean> {
  const supabase = await createClient();

  // Check if quote can be deleted
  const { data: quote } = await supabase
    .from('business_quotes')
    .select('status')
    .eq('id', quoteId)
    .single();

  if (!quote) {
    throw new QuoteGenerationError('Quote not found', 'QUOTE_NOT_FOUND');
  }

  if (!['draft', 'rejected', 'expired'].includes(quote.status)) {
    throw new QuoteGenerationError(
      'Quote cannot be deleted in current status',
      'QUOTE_NOT_DELETABLE'
    );
  }

  const { error } = await supabase
    .from('business_quotes')
    .delete()
    .eq('id', quoteId);

  if (error) {
    throw new QuoteGenerationError(
      'Failed to delete quote',
      'QUOTE_DELETE_ERROR'
    );
  }

  return true;
}
